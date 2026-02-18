import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export class PromptFactory {
  private templatesPath: string;

  constructor(projectRoot: string) {
    this.templatesPath = join(projectRoot, 'src/core/prompts/standard_procedures');
    // Fallback for runtime if src is not available (e.g. dist)
    if (!existsSync(this.templatesPath)) {
         this.templatesPath = join(projectRoot, 'dist/src/core/prompts/standard_procedures');
    }
  }

  public getPrompt(command: string): string {
    const filename = this.mapCommandToFilename(command);
    if (!filename) {
      throw new Error(`Unknown command: ${command}`);
    }

    const filePath = join(this.templatesPath, filename);
    if (!existsSync(filePath)) {
        // Fallback: try to find it in the project root if running from dist but templates are not copied
        // ideally templates should be copied to dist/
        throw new Error(`Prompt template not found: ${filePath}`);
    }

    return readFileSync(filePath, 'utf-8');
  }

  private mapCommandToFilename(command: string): string | null {
    switch (command) {
      case 'init': return 'procedure_init.md';
      case 'req': return 'procedure_req.md';
      case 'arch': return 'procedure_arch.md';
      case 'plan': return 'procedure_plan.md';
      case 'impl': return 'procedure_impl.md';
      case 'verify': return 'procedure_verify.md';
      case 'info': return 'procedure_info.md';
      case 'project': return 'procedure_project.md';
      case 'status': return 'procedure_status.md';
      case 'context': return 'procedure_context.md';
      default: return null;
    }
  }
}
