import { GraphDatabase } from '../../infrastructure/sqlite/GraphDatabase.js';

export interface ThreadSummary {
  nodeId: string;
  type: string;
  status?: string;
  title?: string;
  details?: any;
  children: ThreadSummary[];
}

export class SummaryGenerator {
  constructor(private db: GraphDatabase) {}

  public getThreadSummary(taskId: string): ThreadSummary | null {
    const taskNode = this.db.getNode(taskId);
    if (!taskNode || taskNode.type !== 'execution_task') return null;

    // A thread summary should show the task and what it traces to (up the chain)
    // and maybe what traces to the same requirements (impact).
    // Let's build a tree showing the FRs it traces to, their URs, etc.
    
    // First, let's just get the full upstream lineage but stop at "Anchor" boundaries
    // to prevent walking across the entire V-Model via bidirectional design links.
    const stopTypes = new Set([
      'architecture_view', 'api_contract', 'data_model', 'adr', 
      'test_scenario', 'reference_source', 'user_char', 'stakeholder'
    ]);

    const buildUpstreamTree = (nodeId: string, visited: Set<string>): ThreadSummary => {
      const node = this.db.getNode(nodeId);
      if (!node) return { nodeId, type: 'unknown', children: [] };

      const getTitle = (content: any) => content?.title || content?.name || content?.user_type;
      const nodeTitle = getTitle(node.content);

      if (visited.has(nodeId)) {
        return { nodeId, type: node.type, title: nodeTitle, status: '[Already Shown]', children: [] };
      }
      visited.add(nodeId);

      let children: ThreadSummary[] = [];
      
      // Stop recursing if this node is an Anchor or Design boundary to prevent cyclic spidering
      if (!stopTypes.has(node.type)) {
        const parentIds = this.db.getTraceTargets(nodeId);
        children = parentIds.map(pid => buildUpstreamTree(pid, visited));
      }

      let details: any = undefined;
      if (node.type === 'user_requirement') {
        details = {
          primary_actor: node.content?.primary_actor,
          trigger: node.content?.trigger,
          preconditions: node.content?.preconditions,
          postconditions: node.content?.postconditions,
          main_scenario: node.content?.main_scenario,
          exceptions: node.content?.exceptions
        };
      }

      return {
        nodeId: node.id,
        type: node.type,
        title: nodeTitle,
        status: node.content?.status,
        details,
        children
      };
    };

    return buildUpstreamTree(taskId, new Set());
  }
}
