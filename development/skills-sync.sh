#!/usr/bin/env bash
# Wrapper for `yarn skills`. Delegates to Consensys/skills/tools/sync.
# Lives here (not in package.json) to keep yarn's variable handling out of the way.
set -eu

if [[ -z "${CONSENSYS_SKILLS_DIR:-}" ]]; then
  cat >&2 <<'EOF'
CONSENSYS_SKILLS_DIR is not set.

To set up (one time):
  1. Clone the source repo somewhere on your machine:
       git clone git@github.com:Consensys/skills.git ~/path/to/skills
  2. Export the env var (add to your shell rc):
       export CONSENSYS_SKILLS_DIR=~/path/to/skills

Then re-run `yarn skills`.
EOF
  exit 1
fi

if [[ ! -x "$CONSENSYS_SKILLS_DIR/tools/sync" ]]; then
  cat >&2 <<EOF
CONSENSYS_SKILLS_DIR points to "$CONSENSYS_SKILLS_DIR" but tools/sync is missing.

Either fix the path, or clone Consensys/skills there:
  git clone git@github.com:Consensys/skills.git "$CONSENSYS_SKILLS_DIR"
EOF
  exit 1
fi

exec bash "$CONSENSYS_SKILLS_DIR/tools/sync" --repo metamask-extension --target .
