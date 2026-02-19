import { FSScanner } from '../../infrastructure/fs/Scanner.js';
import { TraceScanner } from '../../infrastructure/fs/TraceScanner.js';
import { GraphDatabase } from '../../infrastructure/sqlite/GraphDatabase.js';
import { SchemaValidator } from './SchemaValidator.js';
import { SemanticValidator } from './SemanticValidator.js';
import { TraceValidator } from './TraceValidator.js';
import { ImpactEngine } from './ImpactEngine.js';
import type { ImpactNode } from './ImpactEngine.js';
import { SpecNode, NodeType } from '../domain/SpecNode.js';
import { readFileSync, writeFileSync } from 'fs';
import { join, basename } from 'path';

export interface NextTaskResult {
    status: 'task' | 'done' | 'blocked';
    task?: any;
    tasks?: any[]; // List of all actionable tasks
    blockedCount: number;
    pendingCount: number;
}

/**
 * Orchestrates the synchronization and validation of the specification.
 * @trace FR-009 (Traceability)
 * @trace FR-015 (Integrity Engine)
 * @trace FR-023 (Shadow Registry)
 * @trace FR-024 (Stateful Planning Engine)
 */
export class SpecEngine {
  private scanner: FSScanner;
  private traceScanner: TraceScanner;
  private schemaValidator: SchemaValidator;
  private semanticValidator: SemanticValidator;
  private traceValidator: TraceValidator;
  private impactEngine: ImpactEngine;

  constructor(
    private projectRoot: string,
    private db: GraphDatabase
  ) {
    this.scanner = new FSScanner(projectRoot);
    this.traceScanner = new TraceScanner(projectRoot);
    this.schemaValidator = new SchemaValidator(join(projectRoot, '.spec/core/schemas'));
    this.semanticValidator = new SemanticValidator(db);
    this.traceValidator = new TraceValidator(db, projectRoot);
    this.impactEngine = new ImpactEngine(db);
  }

  public async updateTaskStatus(id: string, status: string) {
    // Find the file path for the task ID by scanning .spec/data
    const specFiles = await this.scanner.scan(['.spec/data/**/*.json'], { respectIgnoreFiles: false });
    let targetPath = '';
    let content: any = null;

    for (const filePath of specFiles) {
        try {
            const fileContent = JSON.parse(readFileSync(filePath, 'utf8'));
            if (fileContent.id === id) {
                targetPath = filePath;
                content = fileContent;
                break;
            }
        } catch (e) {
            // ignore
        }
    }

    if (!targetPath || !content) {
        throw new Error(`Task ${id} not found in file system.`);
    }
    
    // Validate that it is indeed a task (or at least has a status field)
    if (content.type !== 'execution_task' && !content.status) {
         throw new Error(`Artifact ${id} is not a task.`);
    }

    content.status = status;
    writeFileSync(targetPath, JSON.stringify(content, null, 2));
    
    // Sync to update DB
    await this.sync();
  }

  /**
   * @trace TASK-076 (Verification Workflow)
   */
  public async updateScenarioResult(id: string, result: string) {
    // Find file path
    const specFiles = await this.scanner.scan(['.spec/data/**/*.json'], { respectIgnoreFiles: false });
    let targetPath = '';
    let content: any = null;

    for (const filePath of specFiles) {
        try {
            const fileContent = JSON.parse(readFileSync(filePath, 'utf8'));
            if (fileContent.id === id) {
                targetPath = filePath;
                content = fileContent;
                break;
            }
        } catch (e) { }
    }

    if (!targetPath || !content) throw new Error(`Scenario ${id} not found.`);

    content.last_run_status = result; // Pass/Fail/Skipped
    content.last_run_date = new Date().toISOString();
    
    writeFileSync(targetPath, JSON.stringify(content, null, 2));
    await this.sync();
  }

  public async sync() {
    // Phase 1: Scan .spec/data for all JSON artifacts
    const dataDir = join(this.projectRoot, '.spec/data');
    const specFiles = await this.scanner.scan(['.spec/data/**/*.json'], { respectIgnoreFiles: false });
    
    // Map to track ID -> FilePath to detect collisions
    const knownIds = new Map<string, string>();
    const foundIds = new Set<string>();

    for (const filePath of specFiles) {
        // Skip registry.json itself if it still exists
        if (basename(filePath) === 'registry.json') continue;

        try {
            const content = JSON.parse(readFileSync(filePath, 'utf8'));
            
            // Check for ID collision
            if (content.id) {
                if (knownIds.has(content.id)) {
                    throw new Error(`Duplicate ID detected: ${content.id} is defined in both '${knownIds.get(content.id)}' and '${filePath}'`);
                }
                knownIds.set(content.id, filePath);
                foundIds.add(content.id);
            }
            
            // Prioritize inferred type for system consistency (e.g. TASK-XXX is always execution_task)
            const inferredType = this.inferTypeFromId(content.id);
            const type = inferredType || content.type;

            if (!type) {
                 console.warn(`Skipping file ${filePath}: Could not infer type for ID ${content.id}.`);
                 continue;
            }

            const node = new SpecNode(content.id, type as NodeType, content);
            this.db.upsertNode(node);

            // Extract links from trace_to
            if (content.trace_to) {
                if (Array.isArray(content.trace_to)) {
                    // Legacy/Simple format support
                } else {
                    for (const key in content.trace_to) {
                        const targets = content.trace_to[key];
                        if (Array.isArray(targets)) {
                            for (const targetId of targets) {
                                if (/^[A-Z]{2,4}-[0-9]{3}$/.test(targetId) || /^SYS-[A-Z]+$/.test(targetId)) {
                                    this.db.addLink(content.id, targetId, key);
                                }
                            }
                        }
                    }
                }
            }
        } catch (error) {
            if (error instanceof Error) {
                 console.error(`[Integrity Error] Failed to process ${basename(filePath)}: ${error.message}`);
            } else {
                 console.error(`Failed to process file ${filePath}:`, error);
            }
        }
    }

    // Phase 1.5: Prune stale nodes (Nodes in DB but not in FS, excluding Implementation/Verification)
    const allNodes = this.db.getAllNodes();
    for (const node of allNodes) {
        // Skip nodes managed by other scanners
        if (node.type === NodeType.IMPLEMENTATION || node.type === NodeType.VERIFICATION) {
            continue;
        }

        if (!foundIds.has(node.id)) {
            // console.log(`Pruning stale node: ${node.id}`);
            // TODO: In verbose mode, log this.
            // Also need to be careful about nodes that are NOT file-based but persistent?
            // Currently, all non-impl/verif nodes should be file-based.
            // Exception: Fault Reports if created via API and not saved to file yet? 
            // But system design says everything is file-based.
            this.db.deleteNode(node.id);
        }
    }

    // Phase 2: Run Trace Scanner to populate Implementation nodes
    this.db.deleteNodesByType(NodeType.IMPLEMENTATION);
    this.db.deleteNodesByType(NodeType.VERIFICATION);

    const traceResult = await this.traceScanner.scan();
    for (const node of traceResult.nodes) {
        this.db.upsertNode(node);
        this.db.removeLinksBySource(node.id);
    }
    for (const link of traceResult.links) {
        this.db.addLink(link.source, link.target, 'implements');
    }
  }

  private inferTypeFromId(id: string): NodeType | null {
      if (id.startsWith('CTX-')) return NodeType.CONTEXT;
      if (id.startsWith('STK-')) return NodeType.STAKEHOLDER;
      if (id.startsWith('AS-')) return NodeType.ASSUMPTION;
      if (id.startsWith('UCH-')) return NodeType.USER_CHAR;
      if (id.startsWith('UR-')) return NodeType.USER_REQUIREMENT;
      if (id.startsWith('FR-')) return NodeType.FUNCTIONAL_REQUIREMENT;
      if (id.startsWith('NFR-')) return NodeType.NON_FUNCTIONAL_REQUIREMENT;
      if (id.startsWith('CON-')) return NodeType.CONSTRAINT;
      if (id.startsWith('BR-')) return NodeType.BUSINESS_RULE;
      if (id.startsWith('API-')) return NodeType.API_CONTRACT;
      if (id.startsWith('DATA-')) return NodeType.DATA_MODEL;
      if (id.startsWith('ADR-')) return NodeType.ADR;
      if (id.startsWith('VIEW-')) return NodeType.ARCHITECTURE_VIEW;
      if (id.startsWith('TASK-')) return NodeType.EXECUTION_TASK;
      if (id.startsWith('SYS-')) return NodeType.SYSTEM_REQUIREMENT;
      if (id.startsWith('SCN-')) return NodeType.TEST_SCENARIO;
      if (id.startsWith('REF-')) return NodeType.REFERENCE_SOURCE;
      if (id.startsWith('FRT-')) return NodeType.FAULT_REPORT;
      if (id.startsWith('RCA-')) return NodeType.ROOT_CAUSE_ANALYSIS;
      return null;
  }

  public async validate() {
     const semanticReport = this.semanticValidator.validate();
     const traceReport = await this.traceValidator.validate();
     
     const status = (semanticReport.status === 'FAIL' || traceReport.status === 'FAIL') ? 'FAIL' : 'PASS';
     
     // Merge reports
     const orphans = [...semanticReport.orphans, ...traceReport.orphans];
     const brokenLinks = semanticReport.brokenLinks;

     return {
         status,
         orphans,
         brokenLinks
     };
  }

  public async getStatus() {
    const counts = this.db.getNodeCountsByType();
    const taskCounts = this.db.getTaskStatusCounts();
    const report = await this.validate();
    
    const stages = [
      { id: 0, name: 'Foundation', types: [NodeType.SYSTEM_REQUIREMENT] },
      { id: 1, name: 'Context', types: [NodeType.CONTEXT, NodeType.STAKEHOLDER] },
      { id: 2, name: 'Strategy', types: [NodeType.ASSUMPTION] },
      { id: 3, name: 'Intent', types: [NodeType.USER_CHAR, NodeType.USER_REQUIREMENT] },
      { id: 4, name: 'Specification', types: [NodeType.FUNCTIONAL_REQUIREMENT, NodeType.NON_FUNCTIONAL_REQUIREMENT, NodeType.CONSTRAINT, NodeType.BUSINESS_RULE] },
      { id: 5, name: 'Architecture', types: [NodeType.API_CONTRACT, NodeType.DATA_MODEL, NodeType.ADR, NodeType.ARCHITECTURE_VIEW] },
      { id: 6, name: 'Execution', types: [NodeType.EXECUTION_TASK] },
      { id: 7, name: 'Implementation', types: [NodeType.IMPLEMENTATION] },
      { id: 8, name: 'Verification', types: [NodeType.VERIFICATION, NodeType.TEST_SCENARIO] }
    ];

    const stageStatus = stages.map(stage => {
      const count = stage.types.reduce((acc, type) => acc + (counts[type] || 0), 0);
      return {
        ...stage,
        count,
        status: count > 0 ? 'ACTIVE' : 'PENDING'
      };
    });

    return {
      stageStatus,
      planStatus: taskCounts,
      integrity: report
    };
  }

  /**
   * @trace TASK-074 (Enhance loom next with Task Listing)
   */
  public getPendingTasks(list: boolean = false): NextTaskResult {
    // Fetch all execution tasks to build dependency graph
    const stmt = this.db['db'].prepare("SELECT * FROM nodes WHERE type = 'execution_task'");
    const rows = stmt.all() as any[];
    
    const allTasks = rows.map(row => ({
        ...JSON.parse(row.content),
        id: row.id
    }));

    const statusMap = new Map<string, string>();
    for (const task of allTasks) {
        statusMap.set(task.id, task.status);
    }

    const pendingTasks = allTasks.filter(t => t.status === 'Pending' || t.status === 'In Progress');
    
    if (pendingTasks.length === 0) {
        return { status: 'done', blockedCount: 0, pendingCount: 0 };
    }

    const unblockedTasks = pendingTasks.filter(task => {
        // Filter out locked tasks to prevent collisions
        // But if listing, we might want to show them? No, loom next recommends actionable ones.
        if (!list && task.lock) return false;

        // In Progress tasks are always unblocked (already started)
        if (task.status === 'In Progress') return true;

        // check parent dependency
        if (task.parent_task_id) {
            const parentStatus = statusMap.get(task.parent_task_id);
            if (parentStatus !== 'Done' && parentStatus !== 'Verified') {
                return false; // Blocked by parent
            }
        }

        // check explicit dependencies (DAG)
        if (task.dependencies && Array.isArray(task.dependencies)) {
            for (const depId of task.dependencies) {
                const depStatus = statusMap.get(depId);
                // If dependency is missing or not done, block.
                if (!depStatus || (depStatus !== 'Done' && depStatus !== 'Verified')) {
                    return false;
                }
            }
        }
        
        // Future: Check gate_dependency here
        
        return true;
    });

    if (unblockedTasks.length === 0) {
        return { status: 'blocked', blockedCount: pendingTasks.length, pendingCount: pendingTasks.length };
    }

    const sortedTasks = unblockedTasks.sort((a: any, b: any) => {
        // Sort by Status (In Progress > Pending)
        if (a.status === 'In Progress' && b.status !== 'In Progress') return -1;
        if (b.status === 'In Progress' && a.status !== 'In Progress') return 1;

        // Sort by Priority DESC
        const prioA = a.priority || 0;
        const prioB = b.priority || 0;
        if (prioA !== prioB) {
            return prioB - prioA;
        }
        // Then by ID ASC
        return a.id.localeCompare(b.id);
    });

    if (list) {
        return {
            status: 'task',
            tasks: sortedTasks,
            pendingCount: pendingTasks.length,
            blockedCount: pendingTasks.length - unblockedTasks.length
        };
    }

    return { 
        status: 'task',
        task: sortedTasks[0],
        pendingCount: pendingTasks.length,
        blockedCount: pendingTasks.length - unblockedTasks.length
    };
  }

  public getReviewTasks(): any[] {
    const stmt = this.db['db'].prepare("SELECT * FROM nodes WHERE type = 'execution_task'");
    const rows = stmt.all() as any[];
    
    return rows
        .map(row => JSON.parse(row.content))
        .filter(task => task.status === 'Review')
        .sort((a, b) => a.id.localeCompare(b.id));
  }

  /**
   * @trace TASK-076 (Verification Stats)
   */
  public async getVerificationStats() {
      const stmt = this.db['db'].prepare("SELECT * FROM nodes WHERE type = 'test_scenario'");
      const rows = stmt.all() as any[];
      const scenarios = rows.map(row => JSON.parse(row.content));
      
      const passed = scenarios.filter(s => s.last_run_status === 'Pass').length;
      const failed = scenarios.filter(s => s.last_run_status === 'Fail').length;
      const untested = scenarios.length - passed - failed;
      
      return {
          total: scenarios.length,
          passed,
          failed,
          untested,
          scenarios
      };
  }

  public getImpact(id: string): ImpactNode | null {
    return this.impactEngine.getImpact(id);
  }
}
