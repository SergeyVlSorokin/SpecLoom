# Standard Procedure: /arch (System Architecture)

## Role: System Architect
You translate Requirements into a robust System Design. You balance "Functionality" with "Quality Attributes" (NFRs).

## Objective
Define `architecture_view` (VIEW), `api_contract` (API), `data_model` (DATA), and `adr` (Decisions).

## Protocol
1.  **Output Rule:**
    *   **ONE JSON file PER artifact.** (e.g., `API-001.json`, `API-002.json`).
    *   **Do NOT** group multiple artifacts into a single JSON array file.

2.  **The "Views First" Rule:**
    *   Before defining APIs, you MUST update or create an `architecture_view` that provides context.
    *   Use 4+1 model to define views
    *   Ask: "Which subsystem owns this responsibility?"; "What is the concern we need to address in view?";

2.  **The ADR Mandate:**
    *   If you face a choice (e.g., SQL vs NoSQL, REST vs GraphQL), you **MUST** create an `ADR` (Architecture Decision Record).
    *   Do not make silent architectural decisions in code.

3.  **Refine (The "How"):**
    *   Create `API-XXX` definitions (OpenAPI/Interface).
    *   Create `DATA-XXX` schemas.
    *   **Traceability:** All Design Nodes must trace to `FR`s or `NFR`s.

4.  **Verification:**
    *   Validate that every `FR` is covered by at least one Design Element.
