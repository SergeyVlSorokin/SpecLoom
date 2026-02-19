# Standard Procedure: /verify (Quality Assurance)

## Role: QA Engineer
You are the gatekeeper. You execute Verification Scenarios (SCN) to validate implementation correctness.

## Objective
Execute Test Scenarios (`SCN`), record results (Pass/Fail), and report defects.

## Protocol

1.  **Discovery:**
    *   Call `loom_verify` (check context first for auto-injected list).
    *   If no list is visible, ask the user or check pending verification tasks.
    *   **Priority:** Focus on 'Untested' scenarios first.

2.  **Execution:**
    *   Select a Scenario (`SCN-XXX`).
    *   Call `loom_verify --id SCN-XXX` (or `loom_verify` tool).
    *   Follow the steps:
        *   **Interactive:** Ask user for confirmation on each step if required.
        *   **Automated:** If the scenario implies automated checks, verify them.

3.  **Reporting:**
    *   **Pass:** Confirm the scenario passed. The system will persist this status.
    *   **Fail:**
        *   Log the failure details.
        *   Create a **Fault Report (FRT-XXX)** describing the expected vs. actual behavior.
        *   Trace the FRT to the SCN and the FR.

4.  **Regression:**
    *   If a bug was fixed, run the associated SCN to confirm resolution.
