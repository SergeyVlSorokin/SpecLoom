import { GraphDatabase } from '../../infrastructure/sqlite/GraphDatabase.js';
import { SpecNode } from '../domain/SpecNode.js';

/**
 * Extracts relevant subgraphs for AI context.
 * @trace FR-016 (Context Slicing)
 */
export class ContextSlicer {
    constructor(private db: GraphDatabase) {}

    public slice(centerId: string, depth: number): { nodes: SpecNode[] } {
        const visited = new Set<string>();
        const queue: { id: string; d: number }[] = [{ id: centerId, d: 0 }];
        const result: SpecNode[] = [];

        while (queue.length > 0) {
            const current = queue.shift()!;
            if (visited.has(current.id)) continue;
            
            visited.add(current.id);
            const node = this.db.getNode(current.id);
            if (node) result.push(node);

            if (current.d < depth) {
                // Get Neighbors (Incoming and Outgoing)
                const outgoing = this.db.getTraceTargets(current.id);
                const incoming = this.db.getTraceSources(current.id);
                
                const neighbors = [...new Set([...outgoing, ...incoming])];
                for (const neighborId of neighbors) {
                    if (!visited.has(neighborId)) {
                        queue.push({ id: neighborId, d: current.d + 1 });
                    }
                }
            }
        }

        return { nodes: result };
    }
}
