import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import * as path from 'path';

export interface LoomConfig {
    llm?: {
        provider: 'openai' | 'anthropic' | 'mock';
        apiKey?: string;
        model?: string;
    };
    [key: string]: any;
}

export class ConfigLoader {
    private configPath: string;

    constructor(cwd: string = process.cwd()) {
        this.configPath = path.join(cwd, '.spec/loom.config.json');
    }

    async load(): Promise<LoomConfig> {
        let config: LoomConfig = {};

        if (existsSync(this.configPath)) {
            const content = await readFile(this.configPath, 'utf-8');
            try {
                config = JSON.parse(content);
            } catch (e) {
                console.warn("Failed to parse .spec/loom.config.json");
            }
        }

        // Env var overrides
        if (process.env.LOOM_LLM_API_KEY) {
            config.llm = config.llm || { provider: 'openai' };
            config.llm.apiKey = process.env.LOOM_LLM_API_KEY;
        }
        if (process.env.LOOM_LLM_PROVIDER) {
            config.llm = config.llm || { provider: 'openai' };
            config.llm.provider = process.env.LOOM_LLM_PROVIDER as any;
        }

        return config;
    }
}
