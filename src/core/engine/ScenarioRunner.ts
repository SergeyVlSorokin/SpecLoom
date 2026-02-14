import { GraphDatabase } from '../../infrastructure/sqlite/GraphDatabase.js';
import { SpecNode, NodeType } from '../domain/SpecNode.js';

export interface UserInterface {
    ask(question: string): Promise<string>;
    info(message: string): void;
    error(message: string): void;
    success(message: string): void;
}

export interface ScenarioResult {
    status: 'PASS' | 'FAIL' | 'SKIPPED';
    stepsCompleted: number;
    notes?: string;
}

/**
 * Executes V&V Scenarios.
 * @trace FR-025 (Verification Scenarios)
 */
export class ScenarioRunner {
    constructor(
        private db: GraphDatabase,
        private ui: UserInterface
    ) {}

    public async run(id: string): Promise<ScenarioResult> {
        const node = this.db.getNode(id);
        if (!node || node.type !== NodeType.VERIFICATION) {
            throw new Error(`Scenario ${id} not found or invalid type.`);
        }

        const scenario = node.content;
        this.ui.info(`\n--- Executing Scenario: ${scenario.title} (${id}) ---`);
        
        let stepsCompleted = 0;
        for (const [index, step] of scenario.steps.entries()) {
            this.ui.info(`\nStep ${index + 1}: ${step.step}`);
            this.ui.info(`Expected: ${step.expected_result}`);
            
            const response = await this.ui.ask('Did this step pass? (y/n/skip) ');
            
            if (response.toLowerCase().startsWith('n')) {
                this.ui.error('Step Failed.');
                return { status: 'FAIL', stepsCompleted };
            }
            
            if (response.toLowerCase().startsWith('s')) {
                this.ui.info('Step Skipped.');
                return { status: 'SKIPPED', stepsCompleted };
            }

            stepsCompleted++;
        }

        this.ui.success('Scenario Passed!');
        return { status: 'PASS', stepsCompleted };
    }
}
