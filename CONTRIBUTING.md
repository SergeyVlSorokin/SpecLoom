# Contributing to SpecLoom

We welcome contributions! SpecLoom is a tool for developers who care about traceability and engineering discipline.

## 1. Development Setup

### Prerequisites

* Node.js v20+
* Git

### Build & Run

1. **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/SpecLoom.git
    cd SpecLoom
    ```

2. **Install dependencies:**

    ```bash
    npm install
    ```

3. **Build the project:**

    ```bash
    npm run build
    ```

4. **Run Tests:**

    ```bash
    npm test
    ```

5. **Run locally:**
    You can run the CLI directly from source using `ts-node`:

    ```bash
    npx ts-node src/adapters/cli/index.ts info
    ```

## 2. Project Architecture

* `src/core/domain`: Logic-less entities (SpecNode, Registry).
* `src/core/engine`: Core logic (SpecEngine, SemanticValidator, GraphDB).
* `src/core/use-cases`: High-level workflows (InitService, WorkflowService).
* `src/adapters`: Interface layers (CLI, MCP).
* `.spec/core/schemas`: JSON Schemas defining the artifacts.

## 3. Extending SpecLoom (Custom Schemas)

SpecLoom is data-driven. The "Rules" of what makes a valid requirement or task are defined in JSON Schemas.

### How to Add a New Artifact Type

1. **Define the Schema:**
    Create a new schema file in `.spec/core/schemas/<layer>/<type>.schema.json`.
    * Example: `04_system/security_policy.schema.json`.
    * Ensure it has an `id` pattern (e.g., `^SEC-[0-9]{3}$`).

2. **Register the Schema:**
    Update `src/core/domain/Registry.ts` (if hardcoded types exist) or ensures the `SchemaValidator` picks it up.
    * *Note:* Currently, the engine scans the `schemas` directory dynamically.

3. **Add Traceability Rules:**
    If your new artifact requires specific parents (e.g., a Policy must come from a Stakeholder), update `src/core/engine/SemanticValidator.ts`.

4. **Update the Map:**
    Add the new node to the Traceability Map in `docs/architecture.md`.

## 4. Submitting a Pull Request

1. Create a feature branch.
2. Ensure `npm test` passes.
3. If you changed the logic, update the documentation in `docs/`.
4. Submit PR.
