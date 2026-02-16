# SpecLoom Traceability Map (The Chain of Change)

This document defines the strict dependency graph for SpecLoom artifacts. It enforces the separation between **Governance** (Stakeholders) and **Usage** (Users).

## 1. The Dependency Graph

The arrows ($
ightarrow$) represent "Traces To" (Depends On). If a parent node changes, all children are impacted.

```mermaid
graph TD
    %% --- LAYER 0: CONTEXT & GOVERNANCE ---
    CTX[Product Context]
    STK[Stakeholder] --> CTX
    
    %% --- LAYER 1: DRIVERS ---
    %% Stakeholders drive Policy & Quality
    BR[Business Rule] --> STK
    NFR[Non-Functional Req] --> STK
    CON[Constraint] --> STK
    
    %% Users drive Functionality
    UCH[User Characteristic] --> STK
    %% (UCH links to STK only to show who 'represents' this persona, but UCH is the Actor)

    %% --- LAYER 2: INTENT ---
    %% A User Requirement comes ONLY from a User Characteristic
    UR[User Requirement] --> UCH
    
    %% --- LAYER 3: SPECIFICATION ---
    %% A Function must satisfy a User Need OR comply with a Rule
    FR[Functional Requirement] --> UR
    FR --> BR
    FR --> CON
    FR --> NFR
    
    %% --- LAYER 4: ARCHITECTURE (How) ---
    VIEW[Architecture View] --> FR
    API[API Contract] --> FR
    DATA[Data Model] --> FR
    ADR[Arch. Decision] --> NFR
    ADR --> CON
    
    %% --- LAYER 5: EXECUTION (The Plan) ---
    TASK[Execution Task] --> FR
    TASK --> ADR
    
    %% --- LAYER 6: REALITY (The Code) ---
    CODE[Implementation (src)] -.->|@trace| FR
    CODE -.->|@trace| BR
    
    %% --- LAYER 7: VALIDATION (The Proof) ---
    TEST[Verification (tests)] -.->|@trace| FR
    SCN[Test Scenario] -.->|@trace| FR
    SCN -.->|@trace| UR
```

## 2. Definitions & Rules

### A. Stakeholder vs. User
*   **Stakeholder (`STK`)**: An entity that has an interest in the project but does not necessarily *use* the system (e.g., CTO, Regulator, Buyer).
    *   *Primary Output:* `Business Rules`, `NFRs`, `Constraints`.
*   **User Characteristic (`UCH`)**: A distinct persona or actor that interacts with the system (e.g., "Junior Developer", "Admin").
    *   *Primary Output:* `User Requirements` (User Stories).

### B. The Two Paths to a Feature (`FR`)
A Functional Requirement (`FR`) can exist for two reasons:
1.  **The Usage Path:** A User (`UCH`) has a specific Need (`UR`).
    *   *Example:* "As a Dev (`UCH`), I want to see a graph (`UR`), so the system must render nodes (`FR`)."
2.  **The Governance Path:** A Stakeholder (`STK`) enforces a Rule (`BR`).
    *   *Example:* "The CTO (`STK`) mandates GDPR (`BR`), so the system must encrypt logs (`FR`)."

### C. Validation Triangle
A Feature is **Complete** only when:
1.  **Definition:** The `FR` exists and traces to a `UR` or `BR`.
2.  **Implementation:** Code exists with `@trace FR-XXX`.
3.  **Verification:** A Test/Scenario exists with `@trace FR-XXX` and `@trace UR-XXX`
