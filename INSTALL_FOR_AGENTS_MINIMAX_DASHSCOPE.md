# GBrain Installation Guide for AI Agents: DashScope Embeddings + MiniMax Search

Read this entire file, then follow the steps. Ask the operator for API keys when
needed. Target: about 30 minutes to a fully working brain.

This guide installs the SkyLewis feature branch:

```text
https://github.com/SkyLewis/gbrain/tree/feat/minimax-m2-chat-expansion
```

Default provider policy for this branch:

```text
Embedding: DashScope China endpoint
  dashscope:text-embedding-v4
  1024 dimensions

Search expansion / chat / subagent runtime: MiniMax
  minimax:MiniMax-M2.7
```

## Step 0: Agent Read Order

If you are not Claude Code, read `AGENTS.md` at the repo root first. It is the
non-Claude-agent operating protocol: install flow, trust boundary, common tasks,
and expected read order. Claude Code reads `CLAUDE.md` automatically and can
continue from here.

If you fetched this file by URL without cloning yet, the upstream companion
files live at:

- `https://raw.githubusercontent.com/garrytan/gbrain/master/AGENTS.md`
- `https://raw.githubusercontent.com/garrytan/gbrain/master/llms.txt`
- `https://raw.githubusercontent.com/garrytan/gbrain/master/llms-full.txt`

## Step 1: Install This Branch

Do not clone the PR creation URL. Use the repository URL plus the branch name.

### PowerShell

```powershell
git clone --branch feat/minimax-m2-chat-expansion https://github.com/SkyLewis/gbrain.git $HOME\gbrain
cd $HOME\gbrain

# Install Bun if needed.
powershell -c "irm bun.sh/install.ps1 | iex"

# Restart the shell if bun is not found, then:
bun install
bun link
```

### Bash

```bash
git clone --branch feat/minimax-m2-chat-expansion https://github.com/SkyLewis/gbrain.git ~/gbrain
cd ~/gbrain

curl -fsSL https://bun.sh/install | bash
export PATH="$HOME/.bun/bin:$PATH"

bun install
bun link
```

Verify:

```bash
gbrain --version
```

If `gbrain` is not found, restart the shell or add Bun's bin directory to the
shell profile.

Do not use:

```bash
bun install -g github:SkyLewis/gbrain
```

Bun blocks the top-level postinstall hook on global installs, which can leave
schema migrations unapplied. Use the `git clone + bun link` path above.

## Step 2: API Keys

Ask the operator for these keys:

```text
DASHSCOPE_API_KEY  required for default embeddings
MINIMAX_API_KEY    required for MiniMax search expansion, chat, and subagents
```

### PowerShell, Current Session

```powershell
$env:DASHSCOPE_API_KEY="your DashScope key"
$env:MINIMAX_API_KEY="your MiniMax key"
```

### Bash, Current Session

```bash
export DASHSCOPE_API_KEY="your DashScope key"
export MINIMAX_API_KEY="your MiniMax key"
```

Save these to the user's shell profile or `.env` if the environment should
survive new shells.

## Step 3: Provider Smoke Tests

Run these before creating the brain so configuration problems show up early.

```bash
gbrain providers list
gbrain providers test --model dashscope:text-embedding-v4
gbrain providers test --touchpoint chat --model minimax:MiniMax-M2.7
```

Expected result:

- DashScope embedding probe returns a 1024-dimensional vector.
- MiniMax chat probe returns `pong` or a short equivalent response.

## Step 4: Create the Brain

The user's markdown files are separate from the gbrain tool repository. Ask the
operator where their notes/docs/brain repo live. If they do not have one yet,
create a new one outside `~/gbrain`.

### PowerShell

```powershell
mkdir $HOME\brain
cd $HOME\brain
git init
```

### Bash

```bash
mkdir -p ~/brain
cd ~/brain
git init
```

Then create the gbrain database. Run this from any directory; the brain database
is stored under gbrain's configured data path, not inside the tool repo.

```bash
gbrain init --pglite --model dashscope --chat-model minimax:MiniMax-M2.7 --expansion-model minimax:MiniMax-M2.7
```

What this does:

- `--model dashscope` selects the DashScope recipe's default embedding model:
  `dashscope:text-embedding-v4`.
- DashScope's default embedding dimension is `1024`.
- In this branch, DashScope's default BaseURL is the China endpoint:
  `https://dashscope.aliyuncs.com/compatible-mode/v1`.
- `--chat-model minimax:MiniMax-M2.7` sets the default chat model to MiniMax.
- `--expansion-model minimax:MiniMax-M2.7` sets the search expansion model to
  MiniMax.

## Step 5: Lock In MiniMax Search + Subagent Runtime

After init, set the DB-backed model tier config. This makes future connected CLI
calls resolve MiniMax consistently.

```bash
gbrain config set models.tier.subagent minimax:MiniMax-M2.7
gbrain config set models.chat minimax:MiniMax-M2.7
gbrain config set models.expansion minimax:MiniMax-M2.7
```

Choose the search mode.

The default profile for this document is MiniMax-powered search expansion:

```bash
gbrain config set search.mode tokenmax
```

`tokenmax` enables LLM query expansion and will use
`models.expansion = minimax:MiniMax-M2.7`.

If the operator is cost-sensitive or wants no LLM expansion during retrieval,
use this instead:

```bash
gbrain config set search.mode balanced
```

Important distinction:

- `tokenmax` means search itself calls MiniMax for query expansion.
- `balanced` keeps MiniMax for chat/subagent/downstream reasoning, but search
  retrieval does not call an LLM for expansion.

Verify:

```bash
gbrain search modes
gbrain doctor
```

## Step 6: Import and Embed Markdown

Import the user's brain repo, then create vectors with DashScope.

### PowerShell

```powershell
gbrain import $HOME\brain --no-embed
gbrain embed --stale
gbrain query "key themes across these documents?"
```

### Bash

```bash
gbrain import ~/brain --no-embed
gbrain embed --stale
gbrain query "key themes across these documents?"
```

## Step 7: Existing Brain Migration

Use this section only when switching an existing brain to the branch defaults.

Embedding dimensions affect the vector schema. DashScope `text-embedding-v4` is
1024-dimensional in this recipe. If the existing brain used a different
embedding dimension, re-embed all content after changing the config.

```bash
gbrain config set embedding_model dashscope:text-embedding-v4
gbrain config set embedding_dimensions 1024

gbrain config set models.tier.subagent minimax:MiniMax-M2.7
gbrain config set models.chat minimax:MiniMax-M2.7
gbrain config set models.expansion minimax:MiniMax-M2.7
gbrain config set search.mode tokenmax

gbrain doctor
gbrain embed --all
```

If the operator wants the cost-sensitive retrieval profile:

```bash
gbrain config set search.mode balanced
```

## Step 8: Optional Endpoint Overrides

### DashScope International Endpoint

This branch defaults DashScope to China:

```text
https://dashscope.aliyuncs.com/compatible-mode/v1
```

If the operator uses the international DashScope endpoint:

```bash
gbrain config set provider_base_urls.dashscope https://dashscope-intl.aliyuncs.com/compatible-mode/v1
```

### MiniMax China Endpoint

The MiniMax recipe defaults to:

```text
https://api.minimax.io/v1
```

If the operator needs the MiniMax China endpoint:

```bash
gbrain config set provider_base_urls.minimax https://api.minimaxi.com/v1
```

Run provider tests again after changing endpoints:

```bash
gbrain providers test --model dashscope:text-embedding-v4
gbrain providers test --touchpoint chat --model minimax:MiniMax-M2.7
```

## Step 9: Knowledge Graph Backfill

If the user imported an existing brain repo, backfill links and timeline entries.

Preview:

```bash
gbrain extract links --source db --dry-run
```

Commit:

```bash
gbrain extract links --source db
gbrain extract timeline --source db
gbrain stats
```

For a brand-new empty brain, skip this step. Auto-linking will populate the
graph as the agent writes pages.

## Step 10: Skills and Agent Protocol

Read:

```text
~/gbrain/skills/RESOLVER.md
```

Adopt these immediately:

1. `skills/signal-detector/SKILL.md` — run on every inbound message.
2. `skills/brain-ops/SKILL.md` — brain-first lookup before external calls.
3. `skills/conventions/quality.md` — citations, backlinks, source attribution.

These are quality rules, not optional extras.

## Step 11: Recurring Jobs

Set these up using the user's scheduler: OpenClaw cron, Railway cron, systemd,
crontab, Task Scheduler, or equivalent.

Live sync:

```bash
gbrain sync --repo ~/brain
gbrain embed --stale
```

Auto-update check:

```bash
gbrain check-update --json
```

Weekly health:

```bash
gbrain doctor --json
gbrain embed --stale
```

Do not auto-install updates without telling the operator.

## Step 12: Upgrade This Branch

```bash
cd ~/gbrain
git fetch origin
git checkout feat/minimax-m2-chat-expansion
git pull origin feat/minimax-m2-chat-expansion

bun install
gbrain init
gbrain post-upgrade
gbrain doctor
```

If the user's shell is PowerShell, replace `~/gbrain` with `$HOME\gbrain`.

## Step 13: Final Verification Checklist

Run:

```bash
gbrain --version
gbrain providers list
gbrain providers test --model dashscope:text-embedding-v4
gbrain providers test --touchpoint chat --model minimax:MiniMax-M2.7
gbrain search modes
gbrain doctor
gbrain query "What is in this brain?"
```

Expected:

- `gbrain --version` prints a version.
- DashScope provider test passes.
- MiniMax chat provider test passes.
- `gbrain doctor` has no provider/model warnings.
- `gbrain query` returns results from the imported markdown.

## Minimal Copy-Paste Setup

PowerShell:

```powershell
git clone --branch feat/minimax-m2-chat-expansion https://github.com/SkyLewis/gbrain.git $HOME\gbrain
cd $HOME\gbrain
powershell -c "irm bun.sh/install.ps1 | iex"
bun install
bun link

$env:DASHSCOPE_API_KEY="your DashScope key"
$env:MINIMAX_API_KEY="your MiniMax key"

gbrain providers test --model dashscope:text-embedding-v4
gbrain providers test --touchpoint chat --model minimax:MiniMax-M2.7

gbrain init --pglite --model dashscope --chat-model minimax:MiniMax-M2.7 --expansion-model minimax:MiniMax-M2.7
gbrain config set models.tier.subagent minimax:MiniMax-M2.7
gbrain config set models.chat minimax:MiniMax-M2.7
gbrain config set models.expansion minimax:MiniMax-M2.7
gbrain config set search.mode tokenmax

gbrain doctor
```

Bash:

```bash
git clone --branch feat/minimax-m2-chat-expansion https://github.com/SkyLewis/gbrain.git ~/gbrain
cd ~/gbrain
curl -fsSL https://bun.sh/install | bash
export PATH="$HOME/.bun/bin:$PATH"
bun install
bun link

export DASHSCOPE_API_KEY="your DashScope key"
export MINIMAX_API_KEY="your MiniMax key"

gbrain providers test --model dashscope:text-embedding-v4
gbrain providers test --touchpoint chat --model minimax:MiniMax-M2.7

gbrain init --pglite --model dashscope --chat-model minimax:MiniMax-M2.7 --expansion-model minimax:MiniMax-M2.7
gbrain config set models.tier.subagent minimax:MiniMax-M2.7
gbrain config set models.chat minimax:MiniMax-M2.7
gbrain config set models.expansion minimax:MiniMax-M2.7
gbrain config set search.mode tokenmax

gbrain doctor
```
