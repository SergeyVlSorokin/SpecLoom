# SpecLoom 🧵
>
> **The Compliance & Traceability Layer for AI Agents.**

[![npm version](https://badge.fury.io/js/specloom.svg)](https://badge.fury.io/js/specloom)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

SpecLoom is an **MCP Server** and **CLI** designed to enforce the V-Model in agile and iterative developemnt environments for AI-generated code. It acts as a **Guardian** that prevents hallucinations, ensures traceability, and mandates that every line of code serves a documented requirement.

**Stop "Vibe Coding". Start Engineering.**

---

## 🧠 Why SpecLoom?

* **For AI Agents:** Provides structured "Context Bundles" (Requirements + Design + Code) so you don't have to guess.
* **For Humans:** Enforces "Four-Eyes" review, prevents scope creep, and generates audit-ready documentation automatically.
* **For Teams:** Bridges the gap between "Fast Prototyping" and "Enterprise Compliance".

---

## ⚡ Quick Start

### 1. Installation

```bash
npm install -g specloom
```

### 2. Get Started

Follow the **[Quickstart Guide](docs/quickstart.md)** to set up your project in 5 minutes.

---

## 🔌 AI Integration (MCP)

SpecLoom implements the **Model Context Protocol (MCP)**, acting as the "Brain" for agents like **Gemini CLI**, **Claude Desktop**, **Cursor**, **Windsurf**, or **Cline**.

### Configuration

Add SpecLoom to your agent's settings:

```json
{
  "mcpServers": {
    "specloom": {
      "command": "npx",
      "args": ["-y", "specloom", "loom-server", "--dir", "."],
      "env": {}
    }
  }
}
```

### Available Tools

* **`loom_next`:** Asks "What should I work on?" (Project Manager)
* **`loom_context`:** Asks "Give me the specs and code for this task." (Librarian)
* **`loom_validate`:** Asks "Did I break anything?" (QA)
* **`loom_verify`:** Asks "Does the code meet the requirements?" (Tester)

---

## 🛡️ Key Features

* **Strict V-Model Enforcement:** No Code without Specs. No Specs without Context.
* **Graph-Based Traceability:** Every artifact (User Story, API, Code, Test) is a node in a queryable graph.
* **The "Four-Eyes" Principle:** Prevents self-approval of code (Identity separation).
* **Git-Native:** All artifacts are JSON files committed alongside your code.

---

## 📄 Documentation

* **[Manual (The Theory)](docs/manual.md)**: Deep dive into the V-Model, HADD framework, and advanced workflows.
* **[Architecture](docs/architecture.md)**: System design, diagrams, and core components.
* **[Methodology](docs/methodology.md)**: The philosophy behind HADD and the V-Model.
* **[Contributing](CONTRIBUTING.md)**: How to build and extend SpecLoom.

## License

MIT
