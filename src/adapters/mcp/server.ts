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
        description: 'Execute a verification scenario (Note: Fails on interactive steps)',
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
        description: 'Get a focused subgraph around a node. For Tasks, use loom_bundle.',
        inputSchema: {
          type: 'object',
          properties: {
            node: { type: 'string', description: 'Center Node ID' },
            depth: { type: 'string', description: 'Depth of traversal (default: 1)' }
          },
          required: ['node']
        },
      },
      {
        name: 'loom_bundle',
        description: 'Get execution context bundle for a task',
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
        const node = args?.node as string;
        const depth = args?.depth ? parseInt(args.depth as string) : 1;
        const result = await controller.getContext(node, depth);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
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
      const task = await controller.getNextTask();
      if (!task) return { content: [{ type: 'text', text: 'All tasks completed.' }] };
      return { content: [{ type: 'text', text: JSON.stringify(task, null, 2) }] };
    }

    if (name === 'loom_verify') {
      const id = args?.id as string;
      if (!id) throw new Error('Missing id parameter');
      
      const mcpUi = {
          ask: async (q: string) => { throw new Error(`Interactive prompt not supported in MCP yet: ${q}`); },
          info: (msg: string) => {}, // Silent info
          error: (msg: string) => {},
          success: (msg: string) => {}
      };
      
      try {
          const result = await controller.runScenario(id, mcpUi);
          return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            isError: result.status === 'FAIL'
          };
      } catch (e: any) {
          return { content: [{ type: 'text', text: `Scenario Error: ${e.message}` }], isError: true };
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
