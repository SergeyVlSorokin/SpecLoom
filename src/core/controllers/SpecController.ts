import { SpecEngine } from '../engine/SpecEngine.js';
import { GraphDatabase } from '../../infrastructure/sqlite/GraphDatabase.js';
import { ScenarioRunner, type UserInterface } from '../engine/ScenarioRunner.js';
import { ContextSlicer } from '../engine/ContextSlicer.js';
import { ContextBundleService } from '../use-cases/ContextBundleService.js';
import { ProcessGuardian } from '../engine/ProcessGuardian.js';
import { WorkflowService } from '../use-cases/WorkflowService.js';
import { InitService } from '../use-cases/InitService.js';
import { DocGenerator } from '../use-cases/DocGenerator.js';
import { existsSync, copyFileSync, mkdirSync } from 'fs';
import { join, basename } from 'path';

export class SpecController {
  private engine?: SpecEngine;
  private db?: GraphDatabase;
  private slicer?: ContextSlicer;
  private bundleService?: ContextBundleService;
  private guardian?: ProcessGuardian;
  private workflowService?: WorkflowService;
  private initService: InitService;
  private docGenerator?: DocGenerator;

  constructor(private projectRoot: string) {
    this.initService = new InitService(projectRoot);
    
    // Lazy Initialization Strategy
    // Only initialize DB-dependent services if the project is already initialized.
    const dbDir = join(projectRoot, '.spec');
    if (existsSync(dbDir)) {
        try {
            const dbPath = join(dbDir, 'graph.db');
            this.db = new GraphDatabase(dbPath);
            this.engine = new SpecEngine(projectRoot, this.db);
            this.slicer = new ContextSlicer(this.db);
            this.bundleService = new ContextBundleService(this.db, projectRoot);
            this.guardian = new ProcessGuardian(this.db);
            this.workflowService = new WorkflowService(this.db, projectRoot);
            this.docGenerator = new DocGenerator(this.db, join(projectRoot, '.spec/core/templates'));
        } catch (e) {
            console.warn("Failed to initialize GraphDatabase (Run 'loom init' first):", e);
        }
    }
  }

  private ensureInitialized() {
      if (!this.db || !this.engine) {
          throw new Error("SpecLoom is not initialized. Run 'loom init' first.");
      }
  }

  public init(brownfieldPath?: string) {
      return this.initService.init(brownfieldPath);
  }

  public async generateDocs(outDir?: string) {
      this.ensureInitialized();
      await this.engine!.sync();
      const target = outDir ? join(this.projectRoot, outDir) : join(this.projectRoot, 'description');
      if (!existsSync(target)) {
          const { mkdirSync } = await import('fs'); 
          mkdirSync(target, { recursive: true });
      }
      await this.docGenerator!.generate(target);
      return { message: `Documents generated in ${target}` };
  }

  /**
   * @trace FR-027 (Execution Bundle Retrieval)
   */
  public async getContextBundle(taskId: string) {
      this.ensureInitialized();
      await this.engine!.sync();
      return this.workflowService!.getContextBundle(taskId);
  }

  public async startTask(taskId: string) {
      this.ensureInitialized();
      await this.engine!.sync();
      await this.workflowService!.startTask(taskId);
      return { message: `Task ${taskId} started. Context locked.` };
  }

  public async completeTask(taskId: string) {
      this.ensureInitialized();
      await this.engine!.sync();
      const nextStatus = await this.workflowService!.completeTask(taskId);
      await this.engine!.updateTaskStatus(taskId, nextStatus);
      return { message: `Task ${taskId} completed. Status: ${nextStatus}. Context unlocked.` };
  }

  public async approveTask(taskId: string, reviewer: string) {
      this.ensureInitialized();
      await this.engine!.sync();
      await this.workflowService!.approveTask(taskId, reviewer);
      await this.engine!.updateTaskStatus(taskId, 'Done');
      return { message: `Task ${taskId} approved by ${reviewer}. Status: Done.` };
  }

  /**
   * @trace FR-028 (Process Task Enforcement)
   */
  public async checkGate(phase: string) {
      this.ensureInitialized();
      await this.engine!.sync();
      return this.guardian!.checkGate(phase);
  }

  public async getContext(nodeId: string, depth: number = 1) {
      this.ensureInitialized();
      await this.engine!.sync();
      const result = this.slicer!.slice(nodeId, depth);
      return { 
          center: nodeId,
          depth,
          node_count: result.nodes.length,
          nodes: result.nodes
      };
  }

  public async importReference(sourcePath: string, id: string, title?: string) {
      this.ensureInitialized();
      await this.engine!.sync();
      
      if (!existsSync(sourcePath)) {
          throw new Error(`Source file not found: ${sourcePath}`);
      }

      const attachmentsDir = join(this.projectRoot, '.spec/attachments');
      if (!existsSync(attachmentsDir)) {
          mkdirSync(attachmentsDir, { recursive: true });
      }

      const fileName = basename(sourcePath);
      const targetPath = join(attachmentsDir, fileName);
      copyFileSync(sourcePath, targetPath);

      const content = {
          id,
          type: 'reference_source',
          title: title || fileName,
          description: `Imported from ${sourcePath}`,
          source_path: sourcePath,
          local_path: `.spec/attachments/${fileName}`,
          format: this.detectFormat(fileName),
          trace_to: {} 
      };

      const dataDir = join(this.projectRoot, '.spec/data/01_context');
      if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
      
      const jsonPath = join(dataDir, `${id.toLowerCase()}_${fileName.replace(/\./g, '_')}.json`);
      const { writeFileSync } = await import('fs');
      writeFileSync(jsonPath, JSON.stringify(content, null, 2));

      await this.engine!.sync();
      return { message: `Imported ${fileName} as ${id}` };
  }

  private detectFormat(fileName: string): string {
      const ext = fileName.split('.').pop()?.toLowerCase();
      if (ext === 'pdf') return 'PDF';
      if (ext === 'md') return 'Markdown';
      if (['png', 'jpg', 'jpeg', 'svg'].includes(ext || '')) return 'Image';
      if (['txt', 'json', 'xml'].includes(ext || '')) return 'Text';
      return 'Other';
  }

  public async sync() {
    this.ensureInitialized();
    await this.engine!.sync();
    return { status: 'success', message: 'Specification synced to graph database.' };
  }

  public async runScenario(id: string, ui: UserInterface) {
    this.ensureInitialized();
    await this.engine!.sync();
    const runner = new ScenarioRunner(this.db!, ui);
    return runner.run(id);
  }

  public async validate() {
    this.ensureInitialized();
    const report = await this.engine!.validate();
    return report;
  }

  public async getStatus() {
    this.ensureInitialized();
    await this.engine!.sync();
    return this.engine!.getStatus();
  }

  public async getNextTask() {
    this.ensureInitialized();
    await this.engine!.sync();
    const tasks = this.engine!.getPendingTasks();
    return tasks.length > 0 ? tasks[0] : null;
  }

  public getInfo() {
    const dbPath = join(this.projectRoot, '.spec/graph.db');
    return {
        projectRoot: this.projectRoot,
        dbPath: dbPath,
        version: '1.0.0', 
        mode: existsSync(dbPath) ? 'Active' : 'Not Initialized',
        mandatory_protocols_path: ".spec/core/protocol/",
        instruction: "You MUST read and internalize ALL documents in the mandatory_protocols_path before performing any actions."
    };
  }

  public async updateTaskStatus(id: string, status: string) {
    this.ensureInitialized();
    await this.engine!.updateTaskStatus(id, status);
    return { success: true, message: `Task ${id} updated to ${status}.` };
  }

  public getImpact(id: string) {
    this.ensureInitialized();
    return this.engine!.getImpact(id);
  }

  public dispose() {
    if (this.db) {
        this.db.close();
    }
  }
}
