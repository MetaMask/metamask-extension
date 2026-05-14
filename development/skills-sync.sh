#!/usr/bin/env bash
# Wrapper for `yarn skills`. Delegates to the public MetaMask/skills
# tools/sync (multi-source aware), which walks both:
#   - METAMASK_SKILLS_DIR   (public, no auth, recommended starting point)
#   - CONSENSYS_SKILLS_DIR  (private overlay; optional, internal)
# Private overrides public on name conflict.
#
# Lives here (not in package.json) to keep yarn's variable handling out of the way.
set -eu

SYNC=""

# Prefer the public-repo sync — it's the multi-source-aware tool.
if [[ -n "${METAMASK_SKILLS_DIR:-}" && -x "$METAMASK_SKILLS_DIR/tools/sync" ]]; then
  SYNC="$METAMASK_SKILLS_DIR/tools/sync"
elif [[ -n "${CONSENSYS_SKILLS_DIR:-}" && -x "$CONSENSYS_SKILLS_DIR/tools/sync" ]]; then
  # Fallback for engineers who only have the private checkout configured.
  SYNC="$CONSENSYS_SKILLS_DIR/tools/sync"
fi

if [[ -z "$SYNC" ]]; then
  cat >&2 <<'EOF'
No skills source configured. Set at least one of:

  METAMASK_SKILLS_DIR   public MetaMask/skills checkout (no auth)
  CONSENSYS_SKILLS_DIR  private Consensys/skills checkout (internal overlay)

Quickstart (public, recommended):
  git clone https://github.com/MetaMask/skills ~/dev/metamask/skills
  export METAMASK_SKILLS_DIR=~/dev/metamask/skills

For private overlays (Consensys internal):
  git clone git@github.com:Consensys/skills.git ~/dev/Consensys/skills
  export CONSENSYS_SKILLS_DIR=~/dev/Consensys/skills

Then re-run `yarn skills`.
EOF
  exit 1
fi

exec bash "$SYNC" --repo metamask-extension --target . "$@"
