import { GraphDatabase } from '../../infrastructure/sqlite/GraphDatabase.js';

export interface ImpactNode {
  id: string;
  type: string;
  children: ImpactNode[];
}

export class ImpactEngine {
  constructor(private db: GraphDatabase) {}

  public getImpact(rootId: string): ImpactNode | null {
    const root = this.db.getNode(rootId);
    if (!root) return null;

    const visited = new Set<string>();
    return this.buildTree(rootId, visited);
  }

  private buildTree(nodeId: string, visited: Set<string>): ImpactNode {
    const node = this.db.getNode(nodeId);
    if (!node) {
      return { id: nodeId, type: 'unknown', children: [] };
    }

    // Prevent circular recursion
    if (visited.has(nodeId)) {
      return { id: nodeId, type: node.type, children: [] };
    }
    visited.add(nodeId);

    // Find children: Nodes that trace TO this node
    // In our DB, Link is Source -> Target.
    // Spec: Child (Source) traces to Parent (Target).
    // Impact: Parent changed -> Find Children.
    // So we want to find all sources where target = nodeId.
    const childrenIds = this.db.getTraceSources(nodeId);

    const children = childrenIds.map(childId => this.buildTree(childId, new Set(visited)));

    return {
      id: node.id,
      type: node.type,
      children
    };
  }
}
