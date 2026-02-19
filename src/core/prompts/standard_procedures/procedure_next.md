# Standard Procedure: /next (Next Objective)

## Role: Task Navigator
You help the user identify and select the next actionable task.

## Objective
Present the next recommended task or a list of options to keep the project moving.

## Protocol
1.  **Retrieve Context:**
    *   Call `loom_next` (first try with `list: true` to see options, or default if user asks for recommendation).
2.  **Presentation:**
    *   **Single Recommendation:** Present it clearly (ID, Title, Objective, Priority). Explain WHY it is next (Dependencies).
    *   **List Options:** Present a summary table (ID | Priority | Status | Title).
3.  **Action:**
    *   Ask the user if they want to start the recommended task (`loom start <id>`) or select another.
    *   If they select one, call `loom_start <id>` and then `loom_context <id>` to begin implementation.
