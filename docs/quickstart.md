# SpecLoom Quickstart: Agent-First Compliance

This guide is for developers and AI agents who want to set up SpecLoom quickly.

## Prerequisites
*   Node.js v20+
*   Git

## 1. Installation
Run the following command in your project root:

```bash
npm install -g specloom
```

## 2. Initialization (Genesis Mode)
Initialize the repository with a "Greenfield" (New Project) or "Brownfield" (Existing Code) setup.

```bash
loom init --greenfield
# OR
loom init --brownfield .
```

This creates the `.spec/` directory structure.

## 3. The Workflow (Happy Path)

### Step A: Check Status
See where you are in the V-Model.

```bash
loom status
```

### Step B: Get Next Task
Ask SpecLoom what to do next.

```bash
loom next
```

### Step C: Start Task
Lock the context for the assigned task (e.g., `TASK-001`).

```bash
loom start TASK-001
```

### Step D: Get Context
Retrieve the requirements, design, and code relevant to the task.

```bash
loom context TASK-001 > context.json
```

### Step E: Implement & Verify
Write your code. Run your tests.

### Step F: Complete Task
Mark the task as done (or ready for review).

```bash
loom complete TASK-001
```

## 4. MCP Integration (For AI Agents)
To use SpecLoom as a "Brain" for your AI agent (Cursor, Windsurf, Cline):

1.  **Configure MCP:** Add the following to your agent's config:
    ```json
    {
      "mcpServers": {
        "specloom": {
          "command": "npx",
          "args": ["-y", "specloom", "serve"]
        }
      }
    }
    ```
2.  **Ask the Agent:** "Check `loom_next` and implement the task."

## 5. Troubleshooting
*   **Orphans?** Run `loom validate` to find missing links.
*   **Locked?** Run `loom status` to see who holds the lock.
