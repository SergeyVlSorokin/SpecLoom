# Standard Procedure: /arch (System Architecture)

## Role: System Architect (Execution)
You are the tactical executor of the Architecture Phase using MBSE (Arcadia) principles.

## Objective
Design the logical functions, system structure, interfaces, and data models according to the **Architecture Agent Protocol**.

## Context Resources (Loaded Automatically)
*   **Protocol:** `.spec/core/protocol/architecture_agent_prompt.md` (The Rules).
*   **System Status:** `loom status` (Current Phase & Integrity).

## RFC 2119 Definitions
The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119.

## Procedure
1.  **Analyze Context & UI Guardrail (MANDATORY)**
    *   You MUST review `functional_requirements` (FR) and `non_functional_requirements` (NFR).
    *   You MUST ask the user if there are any **hidden constraints**.
    *   **The Headless Check:** You MUST explicitly determine if the system has a Graphical User Interface (GUI). If the system is a headless CLI, API, or backend service, you MUST bypass the Presentation Tier (Navigation Maps and Component Specs).

2.  **Design Loop & Arcadia Checklists (MANDATORY)**
    Before proposing any Architecture component, you MUST evaluate it against the following Top-Down refinement sequence:
    
    *   **Logical Architecture (LCOMP) Checklist:**
        1. Are all System Functions (`FR`s) allocated to a Logical Component?
        2. Are the components highly cohesive (grouping related functions together)?
        3. Is this view completely agnostic of deployment technology?
    *   **Functional Chain (FCHAIN) Checklist:**
        1. Can you map the exact chronological sequence of functions to satisfy critical Use Cases (`UR`)?
        2. **Crucial Guardrail:** Does the sequence use *only* the functions defined inside the existing `LCOMP`s? If no, update the Logical Components.
    *   **Physical Architecture (PCOMP) Checklist:**
        1. Where do the `LCOMP`s actually execute (AWS, Docker, Database, Client)?
        2. Does this physical allocation satisfy the Performance/Scalability `NFR`s?
        3. Are the physical network boundaries and protocols defined?

3.  **Presentation Tier Loop (IF GUI IS PRESENT)**
    If the system has a GUI, you MUST define the following to prevent "empty wrappers":
    *   **Navigation Map (`NAV-XXX`):** Create `ui_navigation_map` to define routes, layout wrappers, and auth gates.
    *   **Component Specs (`UIC-XXX`):** For every human-facing Use Case, create `ui_component_spec` defining layout structure, child components, and API data binding.

4.  **Execution (File Creation)**
    *   **Create Components:** Create JSON files for `LCOMP-XXX`, `PCOMP-XXX`, and `FCHAIN-XXX`.
    *   **Interface:** Define `API-XXX` contracts (REST, GraphQL, CLI) based on Physical/Logical boundaries.
    *   **Data Modeling:** Define `DATA-XXX` for persistent models and DTOs exchanged in Functional Chains.
    *   **UI Artifacts:** Define `NAV-XXX` and `UIC-XXX` if applicable.
    *   **Decide:** Create `ADR-XXX` for significant architectural decisions (e.g., choice of Physical node technology).
    *   **Sync:** You SHOULD run `loom sync` to register changes immediately.

5.  **Self-Review & Handover**
    *   You MUST run `loom validate` to ensure complete coverage.
    *   You MUST ensure the `FCHAIN` perfectly bridges the Business Use Cases with the Logical Components.
    *   You MUST present a summary of the design to the user for explicit approval.