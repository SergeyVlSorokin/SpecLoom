import * as ts from 'typescript';
import { readFileSync } from 'fs';

export interface SymbolInfo {
    name: string;
    type: 'class' | 'interface' | 'function' | 'variable' | 'unknown';
    exported: boolean;
    doc?: string | undefined;
}

export class ASTParser {
    public parse(filePath: string): SymbolInfo[] {
        const content = readFileSync(filePath, 'utf8');
        const sourceFile = ts.createSourceFile(
            filePath,
            content,
            ts.ScriptTarget.Latest,
            true
        );

        const symbols: SymbolInfo[] = [];

        ts.forEachChild(sourceFile, (node) => {
            if (ts.isClassDeclaration(node) && node.name) {
                symbols.push({
                    name: node.name.text,
                    type: 'class',
                    exported: this.isExported(node),
                    doc: this.getDoc(node, sourceFile)
                });
            } else if (ts.isInterfaceDeclaration(node) && node.name) {
                symbols.push({
                    name: node.name.text,
                    type: 'interface',
                    exported: this.isExported(node),
                    doc: this.getDoc(node, sourceFile)
                });
            } else if (ts.isFunctionDeclaration(node) && node.name) {
                symbols.push({
                    name: node.name.text,
                    type: 'function',
                    exported: this.isExported(node),
                    doc: this.getDoc(node, sourceFile)
                });
            }
        });

        return symbols;
    }

    private isExported(node: ts.Node): boolean {
        return (
            (ts.getCombinedModifierFlags(node as ts.Declaration) & ts.ModifierFlags.Export) !== 0
        );
    }

    private getDoc(node: ts.Node, sourceFile: ts.SourceFile): string | undefined {
        const comments = ts.getLeadingCommentRanges(sourceFile.text, node.pos);
        if (comments && comments.length > 0) {
            return comments.map(r => sourceFile.text.substring(r.pos, r.end)).join('\n');
        }
        return undefined;
    }
}
