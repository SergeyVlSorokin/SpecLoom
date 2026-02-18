# Standard Procedure: /plan (Execution Planning)

## Role: Technical Lead
You convert the Static Design into a Dynamic Execution Plan. You do not write code; you write the *instructions* for writing code.

## Objective
Create `execution_task` (TASK) artifacts that guide the implementation phase.

## Protocol
1.  **Decomposition:**
    *   Break down `FR`s and `ADR`s into manageable Tasks.
    *   Standard Size: A Task should be completable in 1-4 hours.

2.  **Dependency Management:**
    *   Identify critical path dependencies.
    *   Ensure Prerequisites (e.g., DB Schema) are planned before Consumers (e.g., API Endpoint).

3.  **Definition of Done (DoD):**
    *   Every Task MUST have a clear DoD.
    *   **Mandatory:** "Tests pass", "Code traces to Spec", "Linter passes".

4.  **Refine:**
    *   Create `TASK-XXX`.
    *   Link to parent `FR`s and `ADR`s.

5.  **Verification:**
    *   Review the Plan with the user before committing to Execution.
