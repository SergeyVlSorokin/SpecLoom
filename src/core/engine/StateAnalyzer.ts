import { SpecEngine } from './SpecEngine.js';
import { NodeType } from '../domain/SpecNode.js';

export class StateAnalyzer {
  constructor(private engine: SpecEngine) {}

  public async getProjectState() {
    const status = await this.engine.getStatus();
    
    // Determine current phase based on active artifacts
    let currentPhase = 'Genesis';
    if (status.stageStatus?.[0]?.status === 'ACTIVE') currentPhase = 'Foundation';
    if (status.stageStatus?.[1]?.status === 'ACTIVE') currentPhase = 'Context';
    if (status.stageStatus?.[3]?.status === 'ACTIVE') currentPhase = 'Intent';
    if (status.stageStatus?.[4]?.status === 'ACTIVE') currentPhase = 'Specification';
    if (status.stageStatus?.[5]?.status === 'ACTIVE') currentPhase = 'Architecture';
    if (status.stageStatus?.[6]?.status === 'ACTIVE') currentPhase = 'Execution';
    if (status.stageStatus?.[8]?.status === 'ACTIVE') currentPhase = 'Verification';

    const openTasks = await this.engine.getPendingTasks();
    const taskCount = openTasks.pendingCount + openTasks.blockedCount;
    
    const integrityStatus = status.integrity.status;
    const orphanCount = status.integrity.orphans.length;

    return {
      phase: currentPhase,
      open_tasks: taskCount,
      integrity: integrityStatus,
      orphans: orphanCount,
      next_task: openTasks.status === 'task' ? openTasks.task.id : 'None'
    };
  }

  public async getHealthCheck() {
      const state = await this.getProjectState();
      return `Project Phase: ${state.phase} | Integrity: ${state.integrity} | Orphans: ${state.orphans} | Open Tasks: ${state.open_tasks} | Next: ${state.next_task}`;
  }
}
