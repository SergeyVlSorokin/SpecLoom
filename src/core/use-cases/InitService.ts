import { mkdirSync, writeFileSync, existsSync, cpSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

export class InitService {
    constructor(private projectRoot: string) {}

    public init(brownfieldPath?: string) {
        const specDir = join(this.projectRoot, '.spec');
        if (existsSync(specDir)) {
            return { message: 'SpecLoom is already initialized.' };
        }

        // Create Directory Structure
        const dirs = [
            '.spec/core',
            '.spec/data/00_infastructure',
            '.spec/data/01_context',
            '.spec/data/02_pivots',
            '.spec/data/03_users',
            '.spec/data/04_system',
            '.spec/data/05_design',
            '.spec/data/06_execution'
        ];

        dirs.forEach(d => mkdirSync(join(this.projectRoot, d), { recursive: true }));

        // Copy Assets (Schemas & Templates) from Package Distribution
        // Assuming: dist/src/core/use-cases/InitService.js -> ../../../assets/
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);
        const assetsDir = resolve(__dirname, '../../../assets');
        
        if (existsSync(assetsDir)) {
             cpSync(join(assetsDir, 'schemas'), join(this.projectRoot, '.spec/core/schemas'), { recursive: true });
             cpSync(join(assetsDir, 'templates'), join(this.projectRoot, '.spec/core/templates'), { recursive: true });
             cpSync(join(assetsDir, 'protocol'), join(this.projectRoot, '.spec/core/protocol'), { recursive: true });
        } else {
             // Development Fallback (if running ts-node directly)
             const devAssetsDir = resolve(process.cwd(), 'src/assets');
             if (existsSync(devAssetsDir)) {
                  cpSync(join(devAssetsDir, 'schemas'), join(this.projectRoot, '.spec/core/schemas'), { recursive: true });
                  cpSync(join(devAssetsDir, 'templates'), join(this.projectRoot, '.spec/core/templates'), { recursive: true });
                  cpSync(join(devAssetsDir, 'protocol'), join(this.projectRoot, '.spec/core/protocol'), { recursive: true });
             } else {
                  console.warn('Warning: Could not find assets directory to scaffold .spec/core.');
                  // Create empty dirs as fallback
                  mkdirSync(join(this.projectRoot, '.spec/core/schemas'), { recursive: true });
                  mkdirSync(join(this.projectRoot, '.spec/core/templates'), { recursive: true });
             }
        }

        // Create Registry
        const registry = { entries: [] };
        writeFileSync(join(this.projectRoot, '.spec/data/00_infastructure/registry.json'), JSON.stringify(registry, null, 2));

        // Create Brownfield Context if applicable
        if (brownfieldPath) {
             const ctx = {
                 id: "CTX-001",
                 title: "Brownfield Product Context",
                 description: `Legacy codebase at ${brownfieldPath}`,
                 scope: "Migration and Feature Addition"
             };
             writeFileSync(join(this.projectRoot, '.spec/data/01_context/product_context.json'), JSON.stringify(ctx, null, 2));
        }

        return { message: 'SpecLoom initialized successfully.' };
    }
}
