# Design Engineer Preparation — Agent Project

## Purpose

This repository is both a working software project and a learning project.

I am a UX/Product Designer developing stronger full-stack engineering and AI-agent engineering skills. I am not trying to have an AI simply build everything for me. The goal is to understand the architecture and code well enough that I can reason about, modify, debug, and extend the system myself.

The project has progressed incrementally:

- Project 1 — React + Express + JSON
- Project 2 — React + Express + SQLite
- Project 3 — React + Express + SQLite + OpenAI API / Agent Tools
- Project 4A — Agent Foundations From Scratch
- Project 4B — Next phase: build a more capable personal agent, likely using Hermes rather than continuing to recreate all agent infrastructure manually

Git tags are used as project checkpoints.

---

# Learning Style

This is important when helping me.

Do NOT automatically implement large features unless I explicitly ask you to.

Prefer working incrementally:

1. Explain the next concept.
2. Show me the relevant existing code.
3. Explain what needs to change and why.
4. Let me make the change when practical.
5. Review my implementation.
6. Test it.
7. Move to the next concept.

I learn best by understanding how variables, functions, modules, APIs, databases, and system components connect to each other.

When introducing unfamiliar syntax, explain what the syntax actually does rather than assuming I know it.

Ask me to reason about code when useful.

Avoid dumping an entire finished architecture on me at once.

However, do not artificially slow down development. I have already built substantial agent infrastructure from scratch. For mature infrastructure that existing frameworks solve well, it may be better to use the framework and learn by inspecting, modifying, debugging, and extending real applications.

---

# Overall Goal

The eventual goal is a personal agent that I can communicate with remotely, initially through Telegram.

Longer term, I want the agent to be capable of performing software-development work on my computer.

For example:

> "Build a ride-sharing app."

The eventual system should be capable of breaking that request into tasks and using development tools to create files, edit code, run commands, run tests, inspect errors, and iterate.

Conceptually:

User
→ Telegram
→ Personal Agent
→ LLM
→ Tools
→ Local development environment

The goal is NOT merely to build a chatbot.

---

# Current Architecture

The existing application uses:

- React frontend
- Express / Node.js backend
- SQLite via `better-sqlite3`
- OpenAI API
- LLM function/tool calling
- Filesystem tools
- Persistent conversation history
- Conversation summarization
- Long-term memory
- Embeddings
- Semantic memory retrieval

The React interface is primarily a testing interface. Do not invest heavily in UI unless requested because Telegram is intended to become a primary interface.

---

# Backend Responsibilities

`server/index.js`

Responsible primarily for HTTP / Express behavior.

Examples include:

- API routes
- receiving requests
- validating basic request data
- calling the agent
- returning responses

Agent reasoning should generally not be placed directly in Express routes.

---

# Agent Layer

The agent code lives primarily under:

`server/agent/`

Important concepts already implemented include:

- OpenAI Responses API calls
- tool definitions
- tool execution
- iterative tool-calling loop
- conversation context
- long-term memory retrieval
- conversation summarization

The agent can perform multiple tool calls and continue reasoning until it produces a final response.

Conceptually:

LLM
→ tool call(s)
→ JavaScript executes tools
→ tool results returned to LLM
→ LLM reasons again
→ additional tools if necessary
→ final response

Do not replace this architecture casually. It was intentionally built as part of the learning process.

---

# Tool Architecture

There is an intentional separation between:

## Tool definitions

These describe tools to the LLM.

They include things such as:

- tool name
- description
- parameters

## Tool functions

These map tool names to actual JavaScript implementations.

Conceptually:

LLM sees:

`readFile`

JavaScript maps that request to:

`readFile(filename)`

This distinction is important.

---

# Filesystem Tools

Filesystem functionality exists under:

`server/tools/`

The agent currently has tools such as:

- `readFile`
- `writeFile`
- `listFiles`
- `deleteFile`

The filesystem is intentionally restricted to the agent workspace.

The workspace is under:

`server/workspace/`

A path-safety mechanism prevents path traversal such as:

`../index.js`

Do not weaken this security boundary without explicitly discussing the consequences first.

---

# Database

SQLite is used for persistence.

The SQLite database file is currently located at the project root because the database was initialized using a relative path.

Database access functions live primarily in:

`server/data/db.js`

The database contains data for application functionality as well as agent state.

---

# Conversation History

Raw messages are persisted in SQLite.

Each message contains information including:

- conversation ID
- role
- content
- creation time

Messages should be retrieved in deterministic chronological order.

The system currently uses:

`ORDER BY id ASC`

Raw historical messages are not deleted when summarized.

---

# Conversation Summarization

Long conversations are compressed so the entire transcript does not have to be sent to the LLM forever.

The design intentionally maintains three different context layers:

1. Conversation summary
2. Unsummarized raw conversation messages
3. Long-term memories

These should NOT be treated as the same thing.

The conversation record contains:

- `summary`
- `summarizedThroughMessageId`

`summarizedThroughMessageId` acts as a bookmark indicating which messages are already represented by the summary.

The summarization strategy currently:

- preserves at least the newest 20 raw messages
- summarizes older messages in chunks of 10
- retains messages waiting for the next summary chunk as raw context
- never deletes the original messages

Therefore raw context will normally contain roughly 20–29 messages.

The system was tested successfully with a temporary conversation-specific fact:

> The database's temporary nickname is "Banana DB."

The memory evaluator correctly ignored this as long-term memory.

After the original message moved outside the recent context window, the conversation summary preserved it.

When asked later for the temporary database nickname, the agent correctly answered:

> Banana DB

This verified the summary pipeline end-to-end.

---

# Long-Term Memory

Long-term memory is separate from conversation summaries.

Its purpose is to retain durable information that may be useful across conversations.

Memory records contain:

- ID
- content
- embedding
- creation time

A memory evaluator classifies new user information into:

- CREATE
- UPDATE
- IGNORE

CREATE adds new durable information.

UPDATE modifies an existing memory.

IGNORE is used for temporary, redundant, or non-durable information.

---

# Embeddings and Semantic Retrieval

Memory retrieval uses OpenAI embeddings.

Current embedding model:

`text-embedding-3-small`

Embeddings are stored as JSON text in SQLite and parsed back into JavaScript arrays when needed.

Semantic similarity is currently calculated in JavaScript using cosine similarity.

Relevant memories are:

1. scored against the new user message
2. sorted by similarity
3. filtered using a similarity threshold
4. limited to the top results

The current provisional similarity threshold is approximately:

`0.5`

This implementation is intentionally simple and appropriate for the current small memory collection.

Do not prematurely introduce a vector database unless scale or requirements justify it.

---

# Current Context Construction

Before an LLM response, the agent conceptually constructs:

Conversation summary
+
Relevant long-term memories
+
All unsummarized raw conversation messages

This becomes the context supplied to the model.

After the final response:

1. assistant response is stored
2. conversation summary may be updated
3. user message is evaluated for long-term memory

---

# Security Principles

Treat model-generated tool arguments as untrusted input.

The LLM does not automatically receive unrestricted filesystem or operating-system access.

Capabilities should be intentionally exposed through tools.

This becomes especially important when terminal execution is introduced.

Do not give the agent unrestricted command execution without first discussing:

- workspace boundaries
- command allow/deny strategies
- confirmation requirements
- destructive commands
- secrets/environment variables
- network access
- privilege boundaries

---

# Project 4A Status

Project 4A represents the from-scratch agent foundation.

It includes working implementations of:

- agent/tool loop
- multiple tool calls
- filesystem tools
- filesystem security
- SQLite persistence
- conversation history
- conversation summaries
- long-term memory
- embeddings
- semantic retrieval

Project 4A should be treated as a completed learning milestone rather than continuously expanded into a complete production agent framework.

---

# Project 4B Direction

For Project 4B, investigate using Hermes as the higher-level agent framework rather than recreating every production agent capability manually.

The motivation is educational efficiency.

I now understand enough of the underlying agent architecture to benefit from working at a higher abstraction level.

The goal is to spend more learning time building real full-stack applications and agent capabilities rather than rebuilding infrastructure that mature frameworks already provide.

Potential next areas include:

- understanding Hermes architecture
- setting up the personal agent
- Telegram integration
- controlled local development access
- terminal execution
- application generation
- testing/debugging loops
- Git integration
- deployment

Do not assume Hermes must replace every piece of the existing project.

First understand how Hermes relates to the architecture already built and determine which existing components should remain, be integrated, or be replaced.

---

# Working With Existing Code

Before changing architecture:

1. Inspect the existing implementation.
2. Explain how it currently works.
3. Identify the specific limitation.
4. Propose the smallest reasonable change.
5. Discuss significant architectural tradeoffs with me before implementing them.

Avoid unnecessary rewrites.

Prefer extending working code over replacing it merely because another implementation is cleaner.

---

# Code Style / Teaching Preference

Prefer straightforward JavaScript over clever abstractions.

Use descriptive variable names.

When possible, make data flow visible.

For example, I prefer understanding:

`request → route → function → database → result → response`

rather than hiding several steps behind abstractions before they are necessary.

As the project matures, abstractions can be introduced when they solve a real problem.

---

# Important Principle

This repository serves two purposes:

**Build useful software.**

and

**Teach me how the software works.**

Optimize for both.