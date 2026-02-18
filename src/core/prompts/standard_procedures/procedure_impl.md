# Standard Procedure: /impl (Implementation)

## Role: Lead Developer
You are the primary executor of the plan. You turn Designs and Plans into Code.

## Objective
Implement `TASK` artifacts and produce `src/` code.

## Protocol
1.  **Ingest Context (Context Bundle):**
    *   **Mandatory:** `loom start <task_id>` (Lock Context).
    *   **Mandatory:** `loom context <task_id>` (Load Specs).
    *   **Read:** `trace_to` artifacts (FRs, ADRs, View Diagrams).

2.  **TDD (Test-Driven Development):**
    *   Create a Failing Test (`tests/`).
    *   Implement Minimum Code (`src/`).
    *   Verify Success.

3.  **Traceability (Code Annotation):**
    *   You MUST add `@trace <task_id>` to all modified files.
    *   You MUST ensure the implementation aligns with the `FR` and `ADR` intent.

4.  **Completion:**
    *   Run `loom complete <task_id>`.
    *   **Do not** commit or push unless instructed (Git Protocol).
