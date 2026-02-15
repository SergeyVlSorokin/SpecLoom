#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { SpecController } from '../../core/controllers/SpecController.js';

const projectRoot = process.cwd();
const controller = new SpecController(projectRoot);

const server = new Server(
  {
    name: 'specloom-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'loom_sync',
        description: 'Sync JSON artifacts to the graph database',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'loom_validate',
        description: 'Validate specification integrity',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'loom_next',
        description: 'Get the next recommended task for the agent',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'loom_start',
        description: 'Start a Task and lock active context',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Task ID' }
          },
          required: ['id']
        },
      },
      {
        name: 'loom_complete',
        description: 'Complete a Task and unlock context',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Task ID' }
          },
          required: ['id']
        },
      },
      {
        name: 'loom_status',
        description: 'Show current V-Model status and progress',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'loom_info',
        description: 'Show tool configuration and environment info',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'loom_verify',
        description: 'Execute a verification scenario (Non-Interactive: Returns steps for agent to verify)',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Scenario ID (SCN-XXX)' }
          },
          required: ['id']
        },
      },
      {
        name: 'loom_context',
        description: 'Get focused context. If ID is a Task, returns Execution Bundle. If ID is a Node, returns Graph Slice.',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Artifact ID (Task or Node)' },
            depth: { type: 'string', description: 'Depth of slice (default: 1)' }
          },
          required: ['id']
        },
      },
      {
        name: 'loom_init',
        description: 'Initialize SpecLoom in the current directory',
        inputSchema: {
            type: 'object',
            properties: {
                brownfield: { type: 'string', description: 'Path to existing source code' },
                greenfield: { type: 'boolean', description: 'Start a new project from scratch' }
            }
        }
      },
      {
        name: 'loom_import',
        description: 'Import an external reference file',
        inputSchema: {
            type: 'object',
            properties: {
                file: { type: 'string', description: 'Path to file' },
                id: { type: 'string', description: 'Reference ID (REF-XXX)' },
                title: { type: 'string', description: 'Title' }
            },
            required: ['file', 'id']
        }
      },
      {
        name: 'loom_update_task',
        description: 'Update the status of a task manually',
        inputSchema: {
            type: 'object',
            properties: {
                id: { type: 'string', description: 'Task ID' },
                status: { type: 'string', enum: ['Pending', 'In Progress', 'Done', 'Verified'] }
            },
            required: ['id', 'status']
        }
      },
      {
        name: 'loom_generate',
        description: 'Generate SRS/SDD documents',
        inputSchema: {
            type: 'object',
            properties: {
                out: { type: 'string', description: 'Output directory' }
            }
        }
      },
      {
        name: 'loom_bundle',
        description: 'Get execution context bundle for a task (Explicit)',
        inputSchema: {
          type: 'object',
          properties: {
            task_id: { type: 'string', description: 'Task ID' }
          },
          required: ['task_id']
        },
      },
      {
        name: 'loom_impact',
        description: 'Analyze impact of a change to an artifact',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Artifact ID' }
          },
          required: ['id']
        },
      },
      {
        name: 'loom_approve',
        description: 'Approve a Task in Review status',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Task ID' },
            reviewer: { type: 'string', description: 'Reviewer Name' }
          },
          required: ['id', 'reviewer']
        },
      },
      {
        name: 'loom_check_gate',
        description: 'Check V-Model phase gate status',
        inputSchema: {
          type: 'object',
          properties: {
            phase: { type: 'string', enum: ['Define', 'Implement', 'Verify'] }
          },
          required: ['phase']
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === 'loom_start') {
        const id = args?.id as string;
        const result = await controller.startTask(id);
        return { content: [{ type: 'text', text: result.message }] };
    }

    if (name === 'loom_complete') {
        const id = args?.id as string;
        const result = await controller.completeTask(id);
        return { content: [{ type: 'text', text: result.message }] };
    }

    if (name === 'loom_status') {
        const result = await controller.getStatus();
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }

    if (name === 'loom_info') {
        const result = controller.getInfo();
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }

    if (name === 'loom_impact') {
        const id = args?.id as string;
        const result = controller.getImpact(id);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }

    if (name === 'loom_approve') {
        const id = args?.id as string;
        const reviewer = args?.reviewer as string;
        const result = await controller.approveTask(id, reviewer);
        return { content: [{ type: 'text', text: result.message }] };
    }

    /** @trace FR-027 */
    if (name === 'loom_bundle') {
        const taskId = args?.task_id as string;
        const result = await controller.getContextBundle(taskId);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }

    /** @trace FR-028 */
    if (name === 'loom_check_gate') {
        const phase = args?.phase as string;
        const result = await controller.checkGate(phase);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }

    if (name === 'loom_context') {
        const id = (args?.id as string) || (args?.node as string); // Backwards compat attempt
        if (!id) throw new Error("Missing 'id' parameter");

        if (id.startsWith('TASK-')) {
             const result = await controller.getContextBundle(id);
             return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        } else {
             const depth = args?.depth ? parseInt(args.depth as string) : 1;
             const result = await controller.getContext(id, depth);
             return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
    }

    if (name === 'loom_init') {
        const result = controller.init(args?.brownfield as string);
        return { content: [{ type: 'text', text: result.message }] };
    }

    if (name === 'loom_import') {
        const result = await controller.importReference(
            args?.file as string,
            args?.id as string,
            args?.title as string
        );
        return { content: [{ type: 'text', text: result.message }] };
    }

    if (name === 'loom_update_task') {
        const result = await controller.updateTaskStatus(
            args?.id as string,
            args?.status as string
        );
        return { content: [{ type: 'text', text: result.message }] };
    }

    if (name === 'loom_generate') {
        const result = await controller.generateDocs(args?.out as string);
        return { content: [{ type: 'text', text: result.message }] };
    }

    if (name === 'loom_sync') {
      const result = await controller.sync();
      return { content: [{ type: 'text', text: result.message }] };
    }

    if (name === 'loom_validate') {
      await controller.sync();
      const report = await controller.validate();
      return {
        content: [{ type: 'text', text: JSON.stringify(report, null, 2) }],
        isError: report.status === 'FAIL',
      };
    }

    if (name === 'loom_next') {
      const result = await controller.getNextTask();
      if (result.status === 'done') return { content: [{ type: 'text', text: 'All tasks completed.' }] };
      if (result.status === 'blocked') return { content: [{ type: 'text', text: `No actionable tasks. ${result.blockedCount} blocked.` }] };
      return { content: [{ type: 'text', text: JSON.stringify(result.task, null, 2) }] };
    }

    if (name === 'loom_verify') {
      const id = args?.id as string;
      if (!id) throw new Error('Missing id parameter');
      
      const logs: string[] = [];
      const mcpUi = {
          ask: async (q: string) => { throw new Error(`Interactive prompt not supported in MCP yet: ${q}`); },
          info: (msg: string) => { logs.push(msg); },
          error: (msg: string) => { logs.push(`ERROR: ${msg}`); },
          success: (msg: string) => { logs.push(`SUCCESS: ${msg}`); }
      };
      
      try {
          const result = await controller.runScenario(id, mcpUi, false);
          return {
            content: [{ type: 'text', text: JSON.stringify({ ...result, logs }, null, 2) }],
            isError: result.status === 'FAIL'
          };
      } catch (e: any) {
          return { content: [{ type: 'text', text: `Scenario Error: ${e.message}\nLogs:\n${logs.join('\n')}` }], isError: true };
      }
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error: any) {
    return {
      content: [{ type: 'text', text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('SpecLoom MCP Server running on stdio');
}

run().catch((error) => {
  console.error('Fatal error in MCP server:', error);
  process.exit(1);
});
