#!/bin/bash
# SessionStart hook for metamask-extension
# Automatically configures git to add co-author to commits made by Claude
set -euo pipefail

# Read JSON input from stdin (required by Claude Code hooks)
input=$(cat)

# Only run in Claude Code remote/cloud environments
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

echo "Setting up git co-author configuration..." >&2

# Create global git hooks directory
mkdir -p ~/.git-templates/hooks

# Create the prepare-commit-msg hook
cat > ~/.git-templates/hooks/prepare-commit-msg << 'HOOK_EOF'
#!/bin/bash
# Automatically add co-author to commits made by Claude

COMMIT_MSG_FILE=$1
COMMIT_SOURCE=$2

# Only add co-author for regular commits (not merge, squash, amend, etc.)
if [ -z "$COMMIT_SOURCE" ] || [ "$COMMIT_SOURCE" = "message" ]; then
    # Define co-author
    CO_AUTHOR="Co-authored-by: Javier Briones <jvbriones@users.noreply.github.com>"

    # Check if co-author line already exists to avoid duplicates
    if ! grep -q "Co-authored-by: Javier Briones" "$COMMIT_MSG_FILE"; then
        # Append co-author line (with blank line separator)
        echo "" >> "$COMMIT_MSG_FILE"
        echo "$CO_AUTHOR" >> "$COMMIT_MSG_FILE"
    fi
fi
HOOK_EOF

# Make the hook executable
chmod +x ~/.git-templates/hooks/prepare-commit-msg

# Configure git to use the global template directory
git config --global init.templateDir ~/.git-templates

# Apply to current repository
if git rev-parse --git-dir >/dev/null 2>&1; then
    git init >/dev/null 2>&1
    echo "✓ Git co-author configured for Claude commits" >&2
fi

exit 0
