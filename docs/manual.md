# SpecLoom Guide

## Getting Started

SpecLoom is a "Guardian" for your codebase. It enforces a strict V-Model (Requirements -> Design -> Code -> Verification).

**For the complete Workflow Manual, see [WORKFLOW.md](WORKFLOW.md).**

## Quick Start

1.  **Initialize:**
    ```bash
    loom init --greenfield
    ```
2.  **Follow the Plan:**
    ```bash
    loom next
    ```
3.  **Implement a Task:**
    ```bash
    loom start TASK-001  # Locks the context for this task
    loom context TASK-001 # Fetches context bundle
    # ... Write Code (TDD) ...
    loom complete TASK-001 # Releases lock and marks as Done/Review
    ```

## CLI Reference

### Initialization
*   `loom init`: Initialize SpecLoom in the current directory.
    *   `--greenfield`: Start a new project.
    *   `--brownfield <path>`: Integrate with existing code.
*   `loom info`: Show tool configuration and environment info.

### Task Management (Execution Stage)
*   `loom next`: Get the next pending task from the plan.
*   `loom start <id>`: Start a Task and lock active context.
*   `loom complete <id>`: Complete a Task and unlock context.
*   `loom update-task --id <id> --status <status>`: Manually update task status (`Pending`, `In Progress`, `Done`, `Verified`).
*   `loom approve <id> --reviewer <user>`: Approve a Task in `Review` status.

### Spec Management (Stages 0-5)
*   `loom sync`: Sync JSON artifacts to the graph database.
*   `loom validate`: Validate specification integrity (orphans, broken links).
    *   `--ci`: CI mode (headless).
*   `loom import <file> --id <id>`: Import an external reference file (PDF, MD, Image).
*   `loom context <id>`: Get sliced context around a node or a Task Bundle.
    *   `--depth <n>`: Depth of traversal (default: 1).

### Verification & Analysis
*   `loom verify --id <id>`: Run a Verification Scenario (interactive).
*   `loom status`: Show current V-Model status and progress.
*   `loom impact <id>`: Analyze impact of a change to an artifact.
*   `loom generate --out <dir>`: Generate SRS/SDD documents.

## Troubleshooting
Run `loom validate` to find Orphans (Requirements without Parents) or Broken Links.
Use `loom status` to see the overall health of the project.
