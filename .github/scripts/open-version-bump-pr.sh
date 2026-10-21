#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/release-version.sh"

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root" || exit 1

current="$(package_version_from_json < package.json)"
if ! next="$(next_minor_version "$current")"; then
  exit 1
fi

branch="version-bump/${next}"
echo "Current main version: ${current}"
echo "Next main version: ${next}"
echo "Branch: ${branch}"

open_count="$(gh pr list --head "$branch" --base main --state open --json number --jq 'length')"
if [ "$open_count" != "0" ]; then
  echo "An open pull request for ${branch} already exists. Nothing to do."
  exit 0
fi

if git ls-remote --heads origin "$branch" | grep -q .; then
  echo "Branch ${branch} already exists and has no open pull request. Delete it before running this again." >&2
  exit 1
fi

git config user.name "${GIT_USER_NAME:-metamaskbot}"
git config user.email "${GIT_USER_EMAIL:-metamaskbot@users.noreply.github.com}"

git checkout -B "$branch"
replace_package_version package.json "$next"
git add package.json

if git diff --staged --quiet; then
  echo "package.json version did not change." >&2
  exit 1
fi

git commit -m "$(cat <<EOF
release: Bump version to ${next}

Merging this PR cuts release/${current} from the commit before the bump.

Release version: ${current}
New main version: ${next}
Platform: extension
EOF
)"

git push --set-upstream origin "$branch"

body_file="$(mktemp)"
cat > "$body_file" <<EOF
## Version bump before the release cut

This PR bumps \`main\` from \`${current}\` to \`${next}\`.

Merging it cuts \`release/${current}\` from the parent of the merge and opens the release pull request. Until then, \`package.json\` on \`main\` stays at \`${current}\`, so pull requests merged to \`main\` are part of that release.

### Next steps

A release manager reviews and merges this pull request.

### Related

- Release version: ${current}
- Release branch, created on merge: release/${current}
- Platform: extension
EOF

gh pr create \
  --draft \
  --title "release: Bump main version to ${next}" \
  --body-file "$body_file" \
  --base main \
  --head "$branch"

rm -f "$body_file"
echo "Version bump pull request ready: ${branch}"
