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

    /**
     * Checks if a task is blocked because its upstream thread contains Modified nodes.
     * @trace FR-043
     * @trace TASK-089
     */
    public checkTaskExecutionGate(taskId: string): { blocked: boolean; processTask?: any } {
        const visited = new Set<string>();
        let isModified = false;
        const modifiedNodes: string[] = [];

        const traverseUpstream = (currentId: string) => {
            if (visited.has(currentId)) return;
            visited.add(currentId);

            const node = this.db.getNode(currentId);
            if (node && node.content && node.content.handshake_state === 'Modified') {
                isModified = true;
                modifiedNodes.push(currentId);
            }

            const targets = this.db.getTraceTargets(currentId);
            for (const targetId of targets) {
                traverseUpstream(targetId);
            }
        };

        // Start traversal from the targets of the task (the task itself isn't what's modified)
        const taskTargets = this.db.getTraceTargets(taskId);
        for (const targetId of taskTargets) {
            traverseUpstream(targetId);
        }

        if (isModified) {
            return {
                blocked: true,
                processTask: {
                    id: `SYS-PROCESS-${Date.now()}`, // Ephemeral ID for the mock process task
                    title: `Acknowledge Modification for ${taskId}`,
                    type: 'Process',
                    status: 'Pending',
                    description: `Upstream thread contains modified nodes: ${modifiedNodes.join(', ')}. Review and acknowledge to unblock.`,
                    dependencies: [taskId]
                }
            };
        }

        return { blocked: false };
    }
}
