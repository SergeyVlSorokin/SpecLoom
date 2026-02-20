import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class PromptFactory {
  private templatesPath: string;

  constructor() {
    this.templatesPath = join(__dirname, 'standard_procedures');
  }

  public getPrompt(command: string): string {
    const filename = this.mapCommandToFilename(command);
    if (!filename) {
      throw new Error(`Unknown command: ${command}`);
    }

    const filePath = join(this.templatesPath, filename);
    if (!existsSync(filePath)) {
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
      case 'next': return 'procedure_next.md';
      case 'review': return 'procedure_review.md';
      default: return null;
    }
  }
}
