#!/usr/bin/env node
import { Command } from 'commander';
import { createInterface } from 'readline';
import { SpecController } from '../../core/controllers/SpecController.js';

const program = new Command();
const projectRoot = process.cwd();
const controller = new SpecController(projectRoot);

program
  .name('loom')
  .description('SpecLoom CLI - Spec-Driven Development Guardian')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize SpecLoom in the current directory')
  .option('--brownfield <path>', 'Path to existing source code')
  .option('--greenfield', 'Start a new project from scratch')
  .action(async (options) => {
    try {
        const result = controller.init(options.brownfield);
        console.log(result.message);
    } catch (error: any) {
        console.error('Init failed:', error.message);
        process.exit(1);
    } finally {
        controller.dispose();
    }
  });

program
  .command('import')
  .description('Import an external reference file')
  .argument('<file>', 'Path to file')
  .requiredOption('--id <id>', 'Reference ID (REF-XXX)')
  .option('--title <title>', 'Title')
  .action(async (file, options) => {
    try {
      const result = await controller.importReference(file, options.id, options.title);
      console.log(result.message);
    } catch (error: any) {
      console.error('Import failed:', error.message);
      process.exit(1);
    } finally {
      controller.dispose();
    }
  });

program
  .command('sync')
  .description('Sync JSON artifacts to the graph database')
  .action(async () => {
    try {
      const result = await controller.sync();
      console.log(result.message);
    } catch (error: any) {
      console.error('Sync failed:', error.message);
      process.exit(1);
    } finally {
      controller.dispose();
    }
  });

program
  .command('status')
  .description('Show current V-Model status and progress')
  .action(async () => {
    try {
      const status = await controller.getStatus();
      
      console.log('--- Plan Status (The Guiding Star) ---');
      const totalTasks = Object.values(status.planStatus).reduce((a, b) => a + b, 0);
      const doneTasks = status.planStatus['Done'] || 0;
      const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
      
      console.log(`Progress: ${progress}% (${doneTasks}/${totalTasks} Tasks)`);
      Object.entries(status.planStatus).forEach(([state, count]) => {
        console.log(`  - ${state}: ${count}`);
      });

      console.log('\n--- V-Model Artifacts ---');
      status.stageStatus.forEach(stage => {
        const marker = stage.count > 0 ? ' [x] ' : ' [ ] ';
        console.log(`${marker} Stage ${stage.id}: ${stage.name.padEnd(15)} (${stage.count} artifacts)`);
      });
      console.log('\n--- Integrity Check ---');
      console.log(`Status: ${status.integrity.status}`);
      console.log(`Orphans: ${status.integrity.orphans.length}`);
      console.log(`Broken Links: ${status.integrity.brokenLinks.length}`);
      
      if (status.integrity.orphans.length > 0 || status.integrity.brokenLinks.length > 0) {
        console.log('\nHint: Run "loom validate" to see details about orphans and broken links.');
      }
    } catch (error: any) {
      console.error('Status check failed:', error.message);
      process.exit(1);
    } finally {
      controller.dispose();
    }
  });

program
  .command('next')
  .description('Get the next pending task from the plan')
  .action(async () => {
    try {
      const task = await controller.getNextTask();
      if (!task) {
        console.log('All tasks completed! The plan is fulfilled.');
      } else {
        console.log(`\n>>> NEXT OBJECTIVE: ${task.id} <<<`);
        console.log(`Title: ${task.title}`);
        console.log(`Type: ${task.type}`);
        console.log(`Objective: ${task.objective}`);
        
        if (task.ai_instructions && task.ai_instructions.length > 0) {
          console.log('\n--- AI Protocol ---');
          task.ai_instructions.forEach((instr: string) => console.log(`[ ] ${instr}`));
        } else if (task.execution_steps && task.execution_steps.length > 0) {
           console.log('\n--- Execution Steps ---');
           task.execution_steps.forEach((step: string) => console.log(`[ ] ${step}`));
        }

        if (task.context && task.context.relevant_files) {
          console.log('\n--- Context ---');
          console.log('Relevant Files:', task.context.relevant_files.join(', '));
        }
      }
    } catch (error: any) {
      console.error('Next task retrieval failed:', error.message);
      process.exit(1);
    } finally {
      controller.dispose();
    }
  });

program
  .command('info')
  .description('Show tool configuration and environment info')
  .action(() => {
      const info = controller.getInfo();
      console.log('--- SpecLoom Environment ---');
      console.log(`Project Root: ${info.projectRoot}`);
      console.log(`Database:     ${info.dbPath}`);
      console.log(`Version:      ${info.version}`);
      console.log(`Mode:         ${info.mode}`);
      
      if (info.mandatory_protocols_path) {
          console.log('\n--- MANDATORY PROTOCOLS ---');
          console.log(info.instruction);
          console.log(`  Path: ${info.mandatory_protocols_path}`);
      }
      
      controller.dispose();
  });

program
  .command('update-task')
  .description('Update the status of a task')
  .requiredOption('--id <id>', 'Task ID (e.g., TASK-001)')
  .requiredOption('--status <status>', 'New status (Pending, In Progress, Done, Verified)')
  .action(async (options) => {
    try {
      const result = await controller.updateTaskStatus(options.id, options.status);
      console.log(result.message);
    } catch (error: any) {
      console.error('Update failed:', error.message);
      process.exit(1);
    } finally {
      controller.dispose();
    }
  });

program
  .command('verify')
  .description('Run a Verification Scenario (interactive)')
  .requiredOption('--id <id>', 'Scenario ID (e.g., SCN-001)')
  .action(async (options) => {
    try {
      // CLI User Interface Adapter
      const ui = {
        ask: (question: string) => {
            return new Promise<string>((resolve) => {
                const rl = createInterface({
                    input: process.stdin,
                    output: process.stdout
                });
                rl.question(question, (answer) => {
                    rl.close();
                    resolve(answer);
                });
            });
        },
        info: (msg: string) => console.log(msg),
        error: (msg: string) => console.error(`\x1b[31m${msg}\x1b[0m`), // Red
        success: (msg: string) => console.log(`\x1b[32m${msg}\x1b[0m`) // Green
      };

      const result = await controller.runScenario(options.id, ui);
      
      if (result.status === 'FAIL') {
          process.exit(1);
      }
    } catch (error: any) {
      console.error('Verification failed:', error.message);
      process.exit(1);
    } finally {
      controller.dispose();
    }
  });

program
  .command('validate')
  .description('Validate specification integrity')
  .option('--ci', 'Headless mode for CI pipelines')
  .action(async (options) => {
    try {
      await controller.sync();
      const report = await controller.validate();
      
      if (options.ci) {
        if (report.status === 'FAIL') {
          console.error(JSON.stringify(report, null, 2));
          process.exit(1);
        }
        console.log('Validation passed');
        process.exit(0);
      } else {
        console.log('--- Validation Report ---');
        console.log(`Status: ${report.status}`);
        console.log(`Orphans: ${report.orphans.length}`);
        console.log(`Broken Links: ${report.brokenLinks.length}`);
        
        if (report.status === 'FAIL') {
          if (report.orphans.length > 0) {
            console.log('\nOrphans:');
            report.orphans.forEach(id => console.log(`  - ${id}`));
          }
          if (report.brokenLinks.length > 0) {
            console.log('\nBroken Links:');
            report.brokenLinks.forEach(link => console.log(`  - ${link}`));
          }
          process.exit(1);
        }
      }
    } catch (error: any) {
      console.error('Validation failed:', error.message);
      process.exit(1);
    } finally {
      controller.dispose();
    }
  });

program
  .command('context')
  .description('Get sliced context around a node or a Task Bundle')
  .argument('<id>', 'Artifact ID (Task or Node)')
  .option('--depth <n>', 'Depth of slice', '1')
  .action(async (id, options) => {
    try {
      if (id.startsWith('TASK-')) {
          const result = await controller.getContextBundle(id);
          console.log(JSON.stringify(result, null, 2));
      } else {
          const result = await controller.getContext(id, parseInt(options.depth));
          console.log(JSON.stringify(result, null, 2));
      }
    } catch (error: any) {
      console.error('Context retrieval failed:', error.message);
      process.exit(1);
    } finally {
      controller.dispose();
    }
  });

program
  .command('start')
  .description('Start a Task and lock active context')
  .argument('<id>', 'Task ID')
  .action(async (id) => {
    try {
        const result = await controller.startTask(id);
        console.log(result.message);
    } catch (error: any) {
        console.error('Start failed:', error.message);
        process.exit(1);
    } finally {
        controller.dispose();
    }
  });

program
  .command('complete')
  .description('Complete a Task and unlock context')
  .argument('<id>', 'Task ID')
  .action(async (id) => {
    try {
        const result = await controller.completeTask(id);
        console.log(result.message);
    } catch (error: any) {
        console.error('Complete failed:', error.message);
        process.exit(1);
    } finally {
        controller.dispose();
    }
  });

program
  .command('approve')
  .description('Approve a Task in Review status')
  .argument('<id>', 'Task ID')
  .option('--reviewer <user>', 'Reviewer ID', 'Current User')
  .action(async (id, options) => {
    try {
        const result = await controller.approveTask(id, options.reviewer);
        console.log(result.message);
    } catch (error: any) {
        console.error('Approval failed:', error.message);
        process.exit(1);
    } finally {
        controller.dispose();
    }
  });







program
  .command('generate')
  .description('Generate SRS/SDD documents')
  .option('--out <dir>', 'Output directory', 'description')
  .action(async (options) => {
    try {
        const result = await controller.generateDocs(options.out);
        console.log(result.message);
    } catch (error: any) {
        console.error('Generation failed:', error.message);
        process.exit(1);
    } finally {
        controller.dispose();
    }
  });

program
  .command('impact')
  .description('Analyze impact of a change to an artifact')
  .argument('<id>', 'Artifact ID to analyze')
  .action(async (id) => {
    try {
      await controller.sync();
      const impact = controller.getImpact(id);
      if (!impact) {
        console.error(`Artifact ${id} not found.`);
        process.exit(1);
      }
      
      // Recursive print function for better readability?
      // For now, JSON is requested by specs ("Output format supports JSON").
      console.log(JSON.stringify(impact, null, 2));
    } catch (error: any) {
      console.error('Impact analysis failed:', error.message);
      process.exit(1);
    } finally {
      controller.dispose();
    }
  });

program.parse();
