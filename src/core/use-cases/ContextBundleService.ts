import { GraphDatabase } from '../../infrastructure/sqlite/GraphDatabase.js';
import { SpecNode } from '../domain/SpecNode.js';
import type { ContextBundle } from '../interfaces/ContextBundle.js';
import { readFile } from 'fs/promises';
import { join } from 'path';

/**
 * Service to aggregate the execution context for a task.
 * @trace FR-027 (Execution Bundle Retrieval)
 */
export class ContextBundleService {
    constructor(
        private db: GraphDatabase,
        private projectRoot: string
    ) {}

    public async getBundle(taskId: string): Promise<ContextBundle> {
        const taskNode = this.db.getNode(taskId);
        if (!taskNode) {
            throw new Error(`Task ${taskId} not found.`);
        }

        // 1. Traverse Graph (Upstream)
        const graphNodes = new Map<string, SpecNode>();
        const queue: string[] = [taskId];
        const visited = new Set<string>();

        while (queue.length > 0) {
            const currentId = queue.shift()!;
            if (visited.has(currentId)) continue;
            visited.add(currentId);

            // Get parents (upstream requirements)
            const parents = this.db.getTraceTargets(currentId);
            for (const parentId of parents) {
                if (!visited.has(parentId)) {
                    const parentNode = this.db.getNode(parentId);
                    if (parentNode) {
                        graphNodes.set(parentId, parentNode);
                        queue.push(parentId);
                    }
                }
            }
        }

        // 2. Read Files
        const files: Record<string, string> = {};
        const relevantFiles = taskNode.content.context?.relevant_files || [];

        if (Array.isArray(relevantFiles)) {
            for (const relPath of relevantFiles) {
                try {
                    const fullPath = join(this.projectRoot, relPath);
                    const content = await readFile(fullPath, 'utf-8');
                    files[relPath] = content;
                } catch (e) {
                    console.warn(`Failed to read file ${relPath} for task ${taskId}:`, e);
                    files[relPath] = "(File not found or unreadable)";
                }
            }
        }

        return {
            task: taskNode,
            graph: Array.from(graphNodes.values()),
            files
        };
    }
}
