#!/usr/bin/env bash
# Auto-update skills on `yarn install`. Best-effort: never fails the install.
#
# Behavior:
#   - Skipped on CI, or when SKILLS_SKIP_POSTINSTALL=1.
#   - Clones https://github.com/MetaMask/skills (public, no auth) into
#     .skills-cache/metamask-skills if absent.
#   - `git pull --ff-only` if present.
#   - Runs tools/install against this repo.
#   - If CONSENSYS_SKILLS_DIR is set, layered as additional source so
#     internal overlays apply too.
#   - All errors are swallowed with a one-line warning. Engineers can
#     run `yarn skills` manually for interactive feedback.
set -u

if [[ -n "${CI:-}" || -n "${SKILLS_SKIP_POSTINSTALL:-}" ]]; then
  exit 0
fi

CACHE_DIR=".skills-cache/metamask-skills"
PUBLIC_REPO="https://github.com/MetaMask/skills.git"

warn() { echo "skills postinstall: $1 (run \`yarn skills\` for details)" >&2; }

if [[ ! -d "$CACHE_DIR/.git" ]]; then
  mkdir -p "$(dirname "$CACHE_DIR")"
  git clone --depth 1 "$PUBLIC_REPO" "$CACHE_DIR" >/dev/null 2>&1 || { warn "clone failed (offline?)"; exit 0; }
else
  git -C "$CACHE_DIR" fetch --depth 1 origin main >/dev/null 2>&1 || { warn "fetch failed (offline?)"; exit 0; }
  git -C "$CACHE_DIR" reset --hard origin/main >/dev/null 2>&1 || { warn "reset failed"; exit 0; }
fi

INSTALL_ARGS=(--repo metamask-extension --target . --source "$PWD/$CACHE_DIR")
if [[ -n "${CONSENSYS_SKILLS_DIR:-}" && -d "$CONSENSYS_SKILLS_DIR/domains" ]]; then
  INSTALL_ARGS+=(--source "$CONSENSYS_SKILLS_DIR")
fi

bash "$CACHE_DIR/tools/install" "${INSTALL_ARGS[@]}" >/dev/null 2>&1 \
  || warn "install failed"
exit 0
