import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

// Fix for ESM/CJS interop
const AjvConstructor = (Ajv as any).default || Ajv;
const addFormatsFn = (addFormats as any).default || addFormats;

export class SchemaValidator {
  private ajv: any;
  private schemasLoaded = false;

  constructor(private schemasDir: string) {
    this.ajv = new AjvConstructor({ allErrors: true, strict: false });
    addFormatsFn(this.ajv);
  }

  public loadSchemas() {
    if (this.schemasLoaded) return;
    this.loadSchemasRecursive(this.schemasDir);
    this.schemasLoaded = true;
  }

  private loadSchemasRecursive(dir: string) {
    const items = readdirSync(dir);
    for (const item of items) {
      const fullPath = join(dir, item);
      if (statSync(fullPath).isDirectory()) {
        this.loadSchemasRecursive(fullPath);
      } else if (item.endsWith('.schema.json')) {
        const content = readFileSync(fullPath, 'utf8').trim();
        if (!content) {
          continue;
        }
        const schema = JSON.parse(content);
        if (schema.$id) {
            this.ajv.addSchema(schema);
        } else {
            this.ajv.addSchema(schema, item);
        }
      }
    }
  }

  public validate(schemaName: string, data: any): { valid: boolean; errors?: any } {
    this.loadSchemas();
    const validate = this.ajv.getSchema(schemaName);
    if (!validate) {
      throw new Error(`Schema not found: ${schemaName}`);
    }
    const valid = validate(data);
    return { valid: !!valid, errors: validate.errors };
  }
}