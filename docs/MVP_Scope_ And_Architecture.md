# Autonomous Dev Agent System — High-Level Architecture Summary

## Overview

This document summarizes the architectural decisions, design principles, execution model, infrastructure choices, and system components finalized during the brainstorming and planning discussions for the autonomous dev agent platform.

The goal of the system is to build an autonomous backend engineering agent capable of:
- receiving engineering tickets
- understanding repository context
- implementing changes
- running tests
- opening pull requests
- communicating progress in Slack/Jira

The architecture intentionally focuses on:
- reliability
- modularity
- execution safety
- isolated environments
- scalable orchestration

The system is NOT intended to be a fully autonomous AGI engineer.

Instead, it is designed as:

> An autonomous engineering workflow system for well-scoped backend tasks.

---

# 1. Product Vision

The core idea is:

- teams assign tickets directly to an AI engineering account
- the AI agent autonomously works on the task
- the AI opens PRs and updates communication channels
- engineers review the work like normal PRs

The AI acts as:

- a virtual backend engineer
- an asynchronous worker
- an execution agent inside the engineering workflow

NOT:

- a pair programmer
- a temporary IDE assistant
- an engineer impersonation system

---

# 2. Scope Definition

## v1 Supported Work

The agent initially supports:

- CRUD endpoints
- backend APIs
- validation logic
- unit tests
- small bug fixes
- repetitive engineering tasks
- configuration changes
- well-defined backend tasks

These are intentionally:
- highly structured
- pattern-heavy
- low ambiguity

---

## v1 Out of Scope

The following were intentionally excluded:

- frontend/UI work
- architectural redesigns
- production access
- infrastructure changes
- database migrations
- ambiguous requirements
- sprint planning
- large-scale refactors
- complex merge conflict resolution
- autonomous merging to main branch

The system should initially fail safely rather than attempt risky autonomous decisions.

---

# 3. Core Architectural Principles

Several core architectural principles were finalized.

---

## 3.1 Separation of Concerns

The system is intentionally divided into independent layers:

- orchestration
- reasoning/intelligence
- execution/runtime
- integrations/auth
- retrieval/indexing
- container infrastructure

This separation is critical for:
- scalability
- maintainability
- future extensibility
- debugging
- security

---

## 3.2 Persistent vs Ephemeral Components

### Persistent Infrastructure

These components remain alive continuously:

- orchestrator
- MCP integration server
- queue system
- retrieval/indexing systems
- databases
- auth/token management
- API layer

### Ephemeral Components

These are created per task and destroyed afterward:

- Docker containers
- cloned repositories
- runtime execution instances
- task-local agent loops

This design provides:
- isolation
- cleanup
- reproducibility
- lower contamination risk

---

## 3.3 Tool-Driven Agents

The system uses:

> Tool-augmented iterative agents.

The agent does NOT:
- receive the entire repository in prompt
- directly manipulate the filesystem
- execute unrestricted shell commands initially

Instead, the agent:
- calls tools
- receives outputs
- reasons iteratively
- performs incremental actions

This mirrors how modern systems like Cursor/Codex/Claude Code operate internally.

---

# 4. High-Level System Components

The architecture currently consists of the following major components.

---

# 4.1 Main API Server

The API server acts as the system entrypoint.

Responsibilities:

- Jira webhooks
- GitHub webhooks
- dashboard APIs
- task creation
- task state APIs
- triggering queue jobs

The API server is intentionally lightweight.

It does NOT:
- run containers
- host agent loops
- execute runtime logic

This prevents execution workloads from impacting external APIs.

---

# 4.2 Queue System

Current planned choice:

- BullMQ + Redis

Purpose:

- decouple task ingestion from execution
- handle retries
- support concurrency
- support async workflows

Flow:

Jira Webhook
   ↓
Normalize
   ↓
Task Queue
   ↓
Scheduler / Planner Agent (Orchestrator)
   ↓
Exec Queue

The queues act as buffers between external systems, planning, and execution infrastructure.

---

# 4.3 Scheduler / Planner Agent (Orchestrator Service)

The orchestrator is the central control plane, acting as a Scheduler and Planner Agent.

Responsibilities:

- consume raw tasks from the Task Queue
- analyze task feasibility and scope
- if out of scope: send message to Slack
- if feasible: assign to proper agent profile
- push actionable tasks to the Exec Queue
- create containers
- initialize runtimes
- create agent instances
- manage retries
- enforce timeouts
- cleanup execution
- stream logs
- manage task lifecycle

This service runs independently from the API layer.

The orchestrator is persistent infrastructure.

---

# 4.4 Agent / Intelligence Layer

This is the reasoning system.

Responsibilities:

- parse tickets
- decide next actions
- choose tools
- reason over code
- analyze failures
- retry intelligently
- plan edits

Contains:

- LLM loop
- planning logic
- context assembly
- retrieval usage

The intelligence layer runs OUTSIDE containers.

This is a critical architectural decision.

---

# 4.5 Runtime Layer

The runtime layer is the bridge between:

- the agent
- the execution environment

The runtime exposes structured tools.

Example tools:

- readFile()
- searchCode()
- applyPatch()
- runTests()
- gitDiff()
- gitCommit()

The runtime translates tool calls into:

- docker exec
- shell commands
- filesystem operations
- git operations

This layer is one of the most important abstractions in the entire system.

---

# 4.6 Container Execution Layer

Execution occurs inside isolated Docker containers.

Each task receives:

- fresh container
- fresh cloned repo
- isolated filesystem
- isolated git branch

Containers are:

- ephemeral
- disposable
- isolated

Containers are NOT:

- intelligent
- orchestrators
- persistent state holders

Containers are only execution environments.

---

# 4.7 Retrieval / Indexing System

This system provides repository understanding.

Purpose:

- help agent find relevant code quickly
- reduce token waste
- reduce random searching
- improve architectural awareness

Components:

- repo atlas
- embeddings
- chunk indexing
- keyword retrieval
- maintainer/indexer agents

---

# 4.8 MCP Integration Server

This server handles external integrations.

Responsibilities:

- Jira tools
- Slack tools
- GitHub tools
- auth management
- token refresh
- external API abstraction

The MCP layer standardizes external tools.

The agent interacts with:

- tool schemas
- tool interfaces

NOT directly with:

- Slack SDKs
- Jira SDKs
- GitHub APIs

This provides clean separation.

---

# 4.9 Auth Layer

Auth is centralized inside the MCP layer.

Responsibilities:

- store OAuth tokens
- refresh tokens
- manage bot/service accounts
- manage scopes/permissions

Important finalized decision:

Tokens are NEVER injected into containers.

Containers should not hold:

- Jira credentials
- Slack tokens
- GitHub credentials

This significantly improves security.

---

# 5. Agent Identity Model

A major architectural decision was finalized around identity.

The system will use:

> Dedicated AI service accounts.

Examples:

- AI Jira user
- AI Slack bot
- AI GitHub app/bot

The AI behaves as:

> A persistent autonomous engineering teammate.

NOT:

- an engineer impersonation layer
- an OBO (on behalf of) assistant initially

OBO authentication was discussed but intentionally deferred.

Reason:

- dedicated AI identity matches product direction better
- simpler operationally
- easier auditing
- cleaner permissions
- easier enterprise reasoning

---

# 6. MCP Architecture Decisions

A key architecture refinement was the introduction of MCP for external integrations.

Finalized decision:

## MCP SHOULD Handle

- Jira integration
- Slack integration
- GitHub integration
- authentication
- token management
- API abstraction

## MCP SHOULD NOT Handle

- runtime execution
- container tooling
- filesystem manipulation
- patching
- testing

Runtime tools remain internal custom infrastructure.

---

# 7. Runtime Technical Implementation

The runtime layer is implemented using:

- Docker exec
- shell commands
- Linux tooling
- Node wrappers

Core concept:

The runtime executes commands INSIDE containers.

Example:

Agent calls:

searchCode("retryPayment")

Runtime translates into:

rg retryPayment /workspace/repo

inside container.

---

# 8. Initial Runtime Tool Set

Finalized minimal tool set:

- exec()
- getFileTree()
- readFile()
- searchCode()
- applyPatch()
- runTests()
- gitDiff()
- gitCommit()

These are sufficient for a surprisingly capable v1.

The runtime abstraction was considered one of the most important foundational decisions.

---

# 9. File Structure & File Reading

The system retrieves file information through runtime tools.

Examples:

## File Tree

Uses:

- find
- tree

inside containers.

Example:

find /workspace/repo -maxdepth 3

---

## File Reading

Uses:

- cat
- sed
- partial line reads

Example:

sed -n '1,200p' file.ts

Partial reads are preferred to reduce token usage.

---

## Code Search

Uses:

- ripgrep (rg)

This became one of the most important runtime tools.

---

# 10. Retrieval Architecture

A major realization during discussion:

Runtime tools alone are insufficient for large repositories.

The system requires:

> Intelligent retrieval.

Reason:

Large repos contain:
- thousands of files
- huge search entropy
- repeated patterns
- indirect dependencies

Without retrieval:
- token usage explodes
- agents search inefficiently
- reasoning quality drops

---

# 10.1 Retrieval Strategy

Finalized approach:

Hybrid retrieval.

Includes:

- semantic embeddings
- keyword/BM25 search
- syntax-aware chunking

Future upgrades:

- dependency graphs
- graph traversal
- Neo4j-like structure

---

# 10.2 Chunking Strategy

A critical decision:

Chunk code by:

- functions
- classes
- logical syntax units

NOT by token size.

Reason:

Code semantics break under naive token chunking.

---

# 10.3 Repo Atlas

The system will maintain repository-level metadata:

- services
- controllers
- entrypoints
- models
- dependencies
- module structure

This acts as:

> Global repository understanding.

---

# 11. Maintainer / Indexer Agents

Two supporting agents were finalized conceptually.

## Indexer Agent

One-time indexing of repository.

## Maintainer Agent

Incremental updates after merges.

Responsibilities:

- reindex changed files
- refresh embeddings
- keep retrieval fresh

This helps avoid stale context.

---

# 12. Agent Execution Flow

Finalized high-level loop:

1. Ticket assigned
2. Task queued
3. Orchestrator consumes task
4. Container created
5. Repo cloned
6. Runtime initialized
7. Retrieval gathers context
8. Agent loop begins
9. Agent reads/searches files
10. Agent patches code
11. Tests run
12. Retries if needed
13. Git commit
14. PR creation
15. Slack/Jira updates
16. Container destroyed

---

# 13. Container Lifecycle

A detailed technical execution model was finalized.

Containers are managed programmatically.

Flow:

- docker create
- docker start
- docker exec
- docker stop
- docker rm

The orchestrator automates these operations.

---

# 14. Container vs Agent Clarification

A major conceptual clarification:

The agent does NOT live inside the container.

Instead:

Agent
→ runtime tools
→ docker exec
→ container

The intelligence layer runs outside.

Containers are only isolated Linux execution environments.

---

# 15. Concurrent Repository Changes

A critical production concern was discussed:

Other engineers may modify repositories while the agent works.

Finalized handling:

- isolated git branches per task
- rebase before PR creation
- detect conflicts safely
- fail safely if conflicts occur

The system should initially:

- detect conflicts
- stop execution
- notify humans

NOT attempt aggressive autonomous conflict resolution.

---

# 16. Scalability Philosophy

The system is intentionally designed for:

- future distributed execution
- moderate concurrency
- isolated workloads

But implementation should remain simple initially.

Finalized philosophy:

> Architect for scale.
> Implement for simplicity.

---

# 16.1 Initial Deployment Strategy

Current recommended deployment:

## Core Agent Server
Contains:

- orchestrator
- runtime
- retrieval
- planning
- Docker management
- APIs

Single backend service.

---

## MCP Integration Server

Separate service.

Handles:

- integrations
- auth
- external tools

---

# 16.2 Modular Monolith Approach

The system should initially be:

> A modular monolith.

NOT premature microservices.

Reason:

Early complexity should focus on:
- agent reliability
- retrieval quality
- execution safety

NOT distributed service debugging.

---

# 17. Docker & Infrastructure Realizations

A key operational realization:

Containers are NOT free.

Containers consume:

- CPU
- RAM
- disk IO
- network bandwidth

especially during:

- git clone
- npm install
- builds
- tests

---

# 17.1 Production vs Docker Desktop

Docker Desktop on local machines behaves very differently from Linux production servers.

Production Linux servers run containers far more efficiently because:

- no desktop virtualization overhead
- shared Linux kernel
- optimized filesystem behavior

This clarified why local laptops struggle while server infrastructure can scale more effectively.

---

# 17.2 Long-Term Execution Separation

A future scaling direction was finalized:

Eventually separate:

## Control Plane

- orchestrator
- APIs
- retrieval
- MCP

from:

## Execution Plane

- container workers
- heavy builds
- tests
- repo cloning

This mirrors CI/CD architectures like:

- GitHub Actions
- Buildkite
- Jenkins

---

# 18. Authentication Lifecycle

A major clarification was finalized:

The system should NOT:

- login/logout integrations per task

Instead:

- integrations remain persistently authenticated
- MCP layer manages tokens
- tokens refresh automatically when needed

Reason:

The AI platform is persistent infrastructure.

Containers are ephemeral.

Auth lifecycle should NOT depend on task lifecycle.

---

# 19. Finalized High-Level Architecture

The current finalized architecture consists of:

## Persistent Infrastructure

- API server
- orchestrator
- queue system
- retrieval/indexing
- MCP server
- auth management
- databases

## Ephemeral Infrastructure

- Docker containers
- cloned repositories
- runtime instances
- task-local execution loops

---

# 20. Finalized Core Insight

The most important architectural realization:

The system is fundamentally:

> A distributed autonomous engineering workflow platform.

The value is NOT just:

- calling an LLM

The real value comes from:

- orchestration
- retrieval
- runtime tooling
- isolated execution
- integrations
- context assembly
- workflow automation

These systems are much closer to:

- CI/CD infrastructure
- distributed execution systems

than traditional chatbot applications.

---

# Final Architecture Summary

The finalized system consists of:

- autonomous agent reasoning
- isolated Docker execution
- runtime tooling abstraction
- retrieval/indexing infrastructure
- MCP-based external integrations
- persistent orchestration
- ephemeral execution workers
- queue-driven workflows
- dedicated AI service identities

The system is designed to:

- safely automate repetitive engineering tasks
- integrate into existing engineering workflows
- remain modular and scalable
- evolve toward more advanced autonomous execution over time.

