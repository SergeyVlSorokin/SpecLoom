import { readFileSync } from 'fs';
import { relative } from 'path';
import { FSScanner } from './Scanner.js';
import { SpecNode, NodeType } from '../../core/domain/SpecNode.js';

export interface TraceResult {
  nodes: SpecNode[];
  links: { source: string; target: string }[];
}

/**
 * Scans source code for @trace annotations to build the Reality map.
 * @trace FR-006 (Code Scanning)
 * @trace FR-022 (Trace Scanning)
 */
export class TraceScanner {
  constructor(private projectRoot: string) {}

  public async scan(): Promise<TraceResult> {
    const scanner = new FSScanner(this.projectRoot);
    // Scan typical source folders + tests.
    const files = await scanner.scan(['**/*.(ts|js|py|java|cs|go|rs|tsx|jsx)']); 
    
    const nodes: SpecNode[] = [];
    const links: { source: string; target: string }[] = [];

    const traceRegex = /@trace\s+([A-Z]{2,4}-[0-9]{3})/g;

    for (const file of files) {
      const content = readFileSync(file, 'utf8');
      let match;
      const traceTargets = new Set<string>();

      // Reset regex state
      traceRegex.lastIndex = 0;
      
      while ((match = traceRegex.exec(content)) !== null) {
        if (match[1]) {
          traceTargets.add(match[1]);
        }
      }

      if (traceTargets.size > 0) {
        const id = relative(this.projectRoot, file);
        
        // Distinguish between Implementation and Verification
        let type = NodeType.IMPLEMENTATION;
        if (id.startsWith('tests/') || id.startsWith('test/') || id.includes('.test.') || id.includes('.spec.')) {
            type = NodeType.VERIFICATION;
        }

        nodes.push(new SpecNode(id, type, { path: id }));

        for (const target of traceTargets) {
          links.push({ source: id, target });
        }
      }
    }

    return { nodes, links };
  }
}
