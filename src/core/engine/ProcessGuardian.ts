import { GraphDatabase } from '../../infrastructure/sqlite/GraphDatabase.js';

export interface GateResult {
    status: 'PASS' | 'BLOCKED';
    blockingTasks: string[];
    message: string;
}

/**
 * Enforces the V-Model process gates.
 * @trace FR-028 (Process Task Enforcement)
 */
export class ProcessGuardian {
    private static PHASE_MAP: Record<string, string> = {
        'Define': 'SYS-DEFINE',
        'Implement': 'SYS-IMPLEMENT',
        'Verify': 'SYS-VERIFY'
    };

    constructor(private db: GraphDatabase) {}

    public checkGate(phase: string): GateResult {
        const sysId = ProcessGuardian.PHASE_MAP[phase];
        if (!sysId) {
            return { status: 'BLOCKED', blockingTasks: [], message: `Unknown phase: ${phase}` };
        }

        // Find all tasks that trace to this SYS- node
        const blockingTasks: string[] = [];
        
        // We need to find nodes that TARGET sysId via 'system_requirements' link
        // DB.getTraceSources(sysId) returns nodes that point TO sysId.
        const linkedNodes = this.db.getTraceSources(sysId);
        
        for (const nodeId of linkedNodes) {
            const node = this.db.getNode(nodeId);
            if (node && node.type === 'execution_task') {
                // Check if it is a Process task (optional, but good for filtering)
                // The constraint is: if it links to SYS, it blocks the gate until Done.
                const status = node.content.status;
                if (status !== 'Done' && status !== 'Verified') {
                    blockingTasks.push(nodeId);
                }
            }
        }

        if (blockingTasks.length > 0) {
            return {
                status: 'BLOCKED',
                blockingTasks,
                message: `Phase ${phase} is blocked by ${blockingTasks.length} pending Process Tasks.`
            };
        }

        return {
            status: 'PASS',
            blockingTasks: [],
            message: `Phase ${phase} is clear.`
        };
    }
}
