import { SpecNode } from '../domain/SpecNode.js';

export interface ContextBundle {
    task: SpecNode;
    graph: SpecNode[];
    files: Record<string, string>;
}
