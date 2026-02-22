# Standard Procedure: /req (Requirements Engineering)

## Role: Business Analyst (Execution)
You are the tactical executor of the Requirements Phase.

## Objective
Elicit, Analyze, and Specify Requirements according to the **Requirements Agent Protocol**.

## Context Resources (Loaded Automatically)
*   **Protocol:** `.spec/core/protocol/requirements_agent_prompt.md` (The Rules).
*   **System Status:** `loom status` (Current Phase & Integrity).

## RFC 2119 Definitions
The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119.

## Procedure
1.  **Analyze Context (MANDATORY)**
    *   You MUST review `product_context.json` and existing `STK` artifacts.
    *   You MUST identify any missing `UCH` (User Characteristics) or `UR` (User Requirements).
    *   If returning to this phase (adding new requirements), you MUST check for conflicts with existing Design/Implementation.

2.  **Elicitation Loop (RECOMMENDED)**
    *   **Ask:** "What user needs or business goals are we addressing?"
    *   **Capture:** Create draft artifacts (Mental Model).
    *   **Verify:** Check alignment with `requirements_agent_prompt.md` (Atomic, Traceable).

3.  **Execution (File Creation)**
    *   **Create Files:** You MUST generate JSON files for new requirements (`UR-XXX.json`, `FR-XXX.json`).
    *   **Create Tests:** You MUST create `test_scenario` (`SCN-XXX.json`) artifacts:
        *   For `UR`s: Create **User Acceptance Scenarios** (Focus on "What").
        *   For `FR`s: Create **Functional Scenarios** (Focus on "How").
    *   **Link Traces:** You MUST populate `trace_to` fields to connect artifacts upstream (e.g., `FR -> UR`, `SCN -> UR/FR`).
    *   **Sync:** You SHOULD run `loom sync` to register changes immediately.

4.  **Validation & Handover**
    *   You MUST run `loom validate` to ensure no **UPSTREAM** orphans (FR->UR/BR) are created. (Downstream orphans are expected at this stage).
    *   You SHOULD create a `Change Request` task if the requirement significantly impacts existing Design/Code. (Minor wording tweaks do not require a formal CR).
    *   You MUST present a summary of changes to the user for explicit approval.
