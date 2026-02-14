import { globby } from 'globby';
import { readFileSync, existsSync } from 'fs';
import ignore from 'ignore';
import { join, relative } from 'path';

export class FSScanner {
  constructor(private rootDir: string) {}

  public async scan(pattern: string | string[], options: { respectIgnoreFiles?: boolean } = {}): Promise<string[]> {
    const respectIgnores = options.respectIgnoreFiles !== false;
    const ig = ignore();
    
    if (respectIgnores) {
        // Load .gitignore if exists
        const gitignorePath = join(this.rootDir, '.gitignore');
        if (existsSync(gitignorePath)) {
          ig.add(readFileSync(gitignorePath, 'utf8'));
        }

        // Load .specloomignore if exists
        const specloomignorePath = join(this.rootDir, '.specloomignore');
        if (existsSync(specloomignorePath)) {
          ig.add(readFileSync(specloomignorePath, 'utf8'));
        }
    }

    const files = await globby(pattern, {
      cwd: this.rootDir,
      absolute: true,
      dot: true
    });

    if (!respectIgnores) {
        return files;
    }

    return files.filter(file => {
      const relPath = relative(this.rootDir, file);
      return !ig.ignores(relPath);
    });
  }
}
