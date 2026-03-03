# Claude Code Configuration - Claude Flow V3

## Behavioral Rules (Always Enforced)

- Do what has been asked; nothing more, nothing less
- NEVER create files unless they're absolutely necessary for achieving your goal
- ALWAYS prefer editing an existing file to creating a new one
- NEVER proactively create documentation files (*.md) or README files unless explicitly requested
- NEVER save working files, text/mds, or tests to the root folder
- Never continuously check status after spawning a swarm — wait for results
- ALWAYS read a file before editing it
- NEVER commit secrets, credentials, or .env files

## File Organization

- NEVER save to root folder — use the directories below
- Use `/src` for source code files
- Use `/tests` for test files
- Use `/docs` for documentation and markdown files
- Use `/config` for configuration files
- Use `/scripts` for utility scripts
- Use `/examples` for example code

## Project Architecture

- Follow Domain-Driven Design with bounded contexts
- Keep files under 500 lines
- Use typed interfaces for all public APIs
- Prefer TDD London School (mock-first) for new code
- Use event sourcing for state changes
- Ensure input validation at system boundaries

### Project Config

- **Topology**: hierarchical-mesh
- **Max Agents**: 15
- **Memory**: hybrid
- **HNSW**: Enabled
- **Neural**: Enabled

## Build Commands

```bash
# App (run from app/)
npm run build     # Production build
npm test          # Vitest test suite
npm run lint      # ESLint
npm run preview   # Serve production build locally
```

- ALWAYS run tests after making code changes
- ALWAYS verify build succeeds before committing

## Security Rules

- NEVER hardcode API keys, secrets, or credentials in source files
- NEVER commit .env files or any file containing secrets
- Always validate user input at system boundaries
- Always sanitize file paths to prevent directory traversal
- Run `npx @claude-flow/cli@latest security scan` after security-related changes

## Concurrency: 1 MESSAGE = ALL RELATED OPERATIONS

- All operations MUST be concurrent/parallel in a single message
- Use Claude Code's Task tool for spawning agents, not just MCP
- ALWAYS batch ALL todos in ONE TodoWrite call (5-10+ minimum)
- ALWAYS spawn ALL agents in ONE message with full instructions via Task tool
- ALWAYS batch ALL file reads/writes/edits in ONE message
- ALWAYS batch ALL Bash commands in ONE message

## Swarm Orchestration

- MUST initialize the swarm using CLI tools when starting complex tasks
- MUST spawn concurrent agents using Claude Code's Task tool
- Never use CLI tools alone for execution — Task tool agents do the actual work
- MUST call CLI tools AND Task tool in ONE message for complex work

### 3-Tier Model Routing (ADR-026)

| Tier | Handler | Latency | Cost | Use Cases |
|------|---------|---------|------|-----------|
| **1** | Agent Booster (WASM) | <1ms | $0 | Simple transforms (var→const, add types) — Skip LLM |
| **2** | Haiku | ~500ms | $0.0002 | Simple tasks, low complexity (<30%) |
| **3** | Sonnet/Opus | 2-5s | $0.003-0.015 | Complex reasoning, architecture, security (>30%) |

- Always check for `[AGENT_BOOSTER_AVAILABLE]` or `[TASK_MODEL_RECOMMENDATION]` before spawning agents
- Use Edit tool directly when `[AGENT_BOOSTER_AVAILABLE]`

## Swarm Configuration & Anti-Drift

- ALWAYS use hierarchical topology for coding swarms
- Keep maxAgents at 6-8 for tight coordination
- Use specialized strategy for clear role boundaries
- Use `raft` consensus for hive-mind (leader maintains authoritative state)
- Run frequent checkpoints via `post-task` hooks
- Keep shared memory namespace for all agents

```bash
npx @claude-flow/cli@latest swarm init --topology hierarchical --max-agents 8 --strategy specialized
```

## Swarm Execution Rules

- ALWAYS use `run_in_background: true` for all agent Task calls
- ALWAYS put ALL agent Task calls in ONE message for parallel execution
- After spawning, STOP — do NOT add more tool calls or check status
- Never poll TaskOutput or check swarm status — trust agents to return
- When agent results arrive, review ALL results before proceeding

## V3 CLI Commands

### Core Commands

| Command | Subcommands | Description |
|---------|-------------|-------------|
| `init` | 4 | Project initialization |
| `agent` | 8 | Agent lifecycle management |
| `swarm` | 6 | Multi-agent swarm coordination |
| `memory` | 11 | AgentDB memory with HNSW search |
| `task` | 6 | Task creation and lifecycle |
| `session` | 7 | Session state management |
| `hooks` | 17 | Self-learning hooks + 12 workers |
| `hive-mind` | 6 | Byzantine fault-tolerant consensus |

### Quick CLI Examples

```bash
npx @claude-flow/cli@latest init --wizard
npx @claude-flow/cli@latest agent spawn -t coder --name my-coder
npx @claude-flow/cli@latest swarm init --v3-mode
npx @claude-flow/cli@latest memory search --query "authentication patterns"
npx @claude-flow/cli@latest doctor --fix
```

## Available Agents (60+ Types)

### Core Development
`coder`, `reviewer`, `tester`, `planner`, `researcher`

### Specialized
`security-architect`, `security-auditor`, `memory-specialist`, `performance-engineer`

### Swarm Coordination
`hierarchical-coordinator`, `mesh-coordinator`, `adaptive-coordinator`

### GitHub & Repository
`pr-manager`, `code-review-swarm`, `issue-tracker`, `release-manager`

### SPARC Methodology
`sparc-coord`, `sparc-coder`, `specification`, `pseudocode`, `architecture`

## Memory Commands Reference

```bash
# Store (REQUIRED: --key, --value; OPTIONAL: --namespace, --ttl, --tags)
npx @claude-flow/cli@latest memory store --key "pattern-auth" --value "JWT with refresh" --namespace patterns

# Search (REQUIRED: --query; OPTIONAL: --namespace, --limit, --threshold)
npx @claude-flow/cli@latest memory search --query "authentication patterns"

# List (OPTIONAL: --namespace, --limit)
npx @claude-flow/cli@latest memory list --namespace patterns --limit 10

# Retrieve (REQUIRED: --key; OPTIONAL: --namespace)
npx @claude-flow/cli@latest memory retrieve --key "pattern-auth" --namespace patterns
```

## Quick Setup

```bash
claude mcp add claude-flow -- npx -y @claude-flow/cli@latest
npx @claude-flow/cli@latest daemon start
npx @claude-flow/cli@latest doctor --fix
```

## Claude Code vs CLI Tools

- Claude Code's Task tool handles ALL execution: agents, file ops, code generation, git
- CLI tools handle coordination via Bash: swarm init, memory, hooks, routing
- NEVER use CLI tools as a substitute for Task tool agents

## Support

- Documentation: https://github.com/ruvnet/claude-flow
- Issues: https://github.com/ruvnet/claude-flow/issues

---

## Skills

### Linear

**Skill location:** `~/.claude/skills/linear/`
**Full docs:** `~/.claude/skills/linear/SKILL.md`
**Org:** Kleon | **Auth:** via `LINEAR_API_KEY` in `.env`

### Tool Priority

| Tool | When to Use |
|------|-------------|
| **MCP (`mcp__linear`)** | All standard operations — PREFERRED |
| **Helper scripts** | Bulk ops, when MCP unavailable |
| **SDK (`linear-ops.ts`)** | Complex loops, multi-step operations |
| **GraphQL (`query.ts`)** | Unsupported operations only |

### 🔐 Security (Varlock)

```bash
# ✅ Safe — masked output
varlock load 2>&1 | grep LINEAR

# ❌ NEVER — exposes key to context
echo $LINEAR_API_KEY
cat .env
linear config show
```

### Critical Requirements

- **Every issue MUST be in a project**
- **Every project MUST be linked to an initiative**
- **ALWAYS search before creating** — prevent duplicates:

```bash
# Check before creating
npx tsx ~/.claude/skills/linear/scripts/linear-ops.ts help
```

### Quick Commands

```bash
SCRIPTS=~/.claude/skills/linear/scripts

# Project lifecycle
npx tsx $SCRIPTS/linear-ops.ts create-project "Phase X: Name" "Initiative"
npx tsx $SCRIPTS/linear-ops.ts project-status "Phase X" in-progress
npx tsx $SCRIPTS/linear-ops.ts project-status "Phase X" completed

# Issues
npx tsx $SCRIPTS/linear-ops.ts create-issue "Project" "Title" "Description"
npx tsx $SCRIPTS/linear-ops.ts create-sub-issue ENG-100 "Sub-task" "Details"
npx tsx $SCRIPTS/linear-ops.ts status Done ENG-101 ENG-102

# Labels
npx tsx $SCRIPTS/linear-ops.ts labels suggest "Fix auth bug"
npx tsx $SCRIPTS/linear-ops.ts labels validate "feature,frontend"

# Ad-hoc GraphQL
npx tsx $SCRIPTS/query.ts "query { viewer { name } }"
```

### Label Taxonomy

- **Type** (exactly one): `feature`, `bug`, `refactor`, `chore`, `spike`
- **Domain** (1–2): `frontend`, `backend`, `security`, `infrastructure`, `testing`, `mcp`, `cli`
- **Scope** (optional): `blocked`, `breaking-change`, `tech-debt`, `good-first-issue`

### Issue Status Conventions

- Assigned to me → `Todo`
- Unassigned → `Backlog`

### Reference Docs

| File | Purpose |
|------|---------|
| `SKILL.md` | Full skill instructions |
| `api.md` | GraphQL reference |
| `sdk.md` | SDK automation patterns |
| `sync.md` | Bulk sync patterns |
| `projects.md` | Project & initiative management |
| `troubleshooting.md` | MCP debugging, common issues |
| `docs/labels.md` | Full label taxonomy |

---

### Governance

**Skill location:** `~/.claude/skills/governance/`
**Full docs:** `~/.claude/skills/governance/SKILL.md`
**Authoritative reference:** [standards.md](standards.md)

Enforces engineering standards during code review, commits, and standards discussions. Runs a parallel reviewer agent — 70–90% token savings vs inline review.

**Triggers:** "code review", "review this code", "check standards", "pre-commit", "compliance"

#### Key Standards

| Rule | Detail |
|------|--------|
| TypeScript | Strict mode, no `any`, all exports typed |
| File size | Max 500 lines — split if larger |
| Tests | Write alongside code; must pass pre-commit |
| Secrets | Never commit — `.env` gitignored, use Varlock |
| ADRs | Significant architecture decisions → `docs/adr/` |

#### Commands

```bash
# Run compliance check
node ~/.claude/skills/governance/scripts/governance-check.mjs

# Audit against standards
node ~/.claude/skills/governance/scripts/audit-standards-template.mjs
```

#### Reference Docs

| File | Purpose |
|------|---------|
| `SKILL.md` | Full skill instructions |
| `standards.md` | Engineering policy (project root) |
| `templates/standards-template.md` | Extended standards template |
| `docs/adr/000-template.md` | ADR template |

---

### Plan Review

**Skill location:** `~/.claude/skills/plan-review/`
**Full docs:** `~/.claude/skills/plan-review/SKILL.md`

Spawns parallel VP Product, VP Engineering, and VP Design agents to review plans for blockers, anti-patterns, conflicts, and regressions. Returns consolidated recommendations — does not edit files directly.

**Triggers:** "review this plan", "plan review", "assess this plan", "VP review", "stakeholder review"
**Explicit:** `/plan-review-skill`

#### When to Use

- Before executing any phase of `docs/execution/IMPLEMENTATION_PLAN.md`
- When updating `docs/architecture/ARCHITECTURE.md`
- Before starting a new feature or significant refactor

#### Execution Model

1. Dispatcher reads `agent-prompt.md` and spawns one `general-purpose` subagent
2. Subagent coordinates three parallel VP agents (Product / Engineering / Design)
3. Findings consolidated; recommendations returned to main session
4. Main session applies any approved edits via its own Edit tool

> **Foreground execution required** — background mode auto-denies `AskUserQuestion` prompts.

#### This Project's Plans

| Plan | Path |
|------|------|
| Implementation | `docs/execution/IMPLEMENTATION_PLAN.md` |
| Architecture | `docs/architecture/ARCHITECTURE.md` |
| Product requirements | `docs/product/PRD.md` |
