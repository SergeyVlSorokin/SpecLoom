import { createHash } from 'crypto';

export enum NodeType {
  CONTEXT = 'context',
  STAKEHOLDER = 'stakeholder',
  ASSUMPTION = 'assumption',
  USER_CHAR = 'user_char',
  USER_REQUIREMENT = 'user_requirement',
  CONSTRAINT = 'constraint',
  FUNCTIONAL_REQUIREMENT = 'functional_requirement',
  NON_FUNCTIONAL_REQUIREMENT = 'non_functional_requirement',
  API_CONTRACT = 'api_contract',
  DATA_MODEL = 'data_model',
  ADR = 'adr',
  ARCHITECTURE_VIEW = 'architecture_view',
  EXECUTION_TASK = 'execution_task',
  BUSINESS_RULE = 'business_rule',
  SYSTEM_REQUIREMENT = 'system_requirement',
  IMPLEMENTATION = 'implementation',
  VERIFICATION = 'verification',
  TEST_SCENARIO = 'test_scenario',
  REFERENCE_SOURCE = 'reference_source',
  FAULT_REPORT = 'fault_report',
  ROOT_CAUSE_ANALYSIS = 'root_cause_analysis'
}

export class SpecNode {
  public readonly hash: string;
  private static ID_REGEX = /^[A-Z]{2,4}-[0-9]{3}$/;
  private static SYS_ID_REGEX = /^SYS-[A-Z]+$/;

  constructor(
    public readonly id: string,
    public readonly type: NodeType,
    public readonly content: Record<string, any>
  ) {
    if (type !== NodeType.IMPLEMENTATION && 
        type !== NodeType.VERIFICATION && 
        type !== NodeType.SYSTEM_REQUIREMENT && 
        !SpecNode.ID_REGEX.test(id)) {
      throw new Error(`Invalid ID format: ${id}. Expected ${SpecNode.ID_REGEX}`);
    }
    if (type === NodeType.SYSTEM_REQUIREMENT && !SpecNode.SYS_ID_REGEX.test(id)) {
       throw new Error(`Invalid System ID format: ${id}. Expected ${SpecNode.SYS_ID_REGEX}`);
    }
    this.hash = this.calculateHash();
  }

  private calculateHash(): string {
    const str = JSON.stringify(this.content);
    return createHash('sha256').update(str).digest('hex');
  }
}
