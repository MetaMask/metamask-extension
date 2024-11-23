#!/usr/bin/env bash

set -e
set -u
set -o pipefail

# Fetch the latest changes from the remote repository
git fetch origin

# Rebase the current branch onto the latest main branch
git rebase origin/main

# Function to handle conflicts in package-lock.json
handle_package_lock_conflict() {
  git checkout --theirs package-lock.json
  git add package-lock.json
  git rebase --continue
}

# Function to handle other merge conflicts
handle_other_conflicts() {
  git status | grep "both modified" | while read -r line; do
    file=$(echo "$line" | awk '{print $3}')
    echo "Resolving conflict in $file"
    # Open the file and manually resolve conflicts
    # Remove conflict markers and include desired changes
    # Add the resolved file to the staging area
    git add "$file"
  done
  git rebase --continue
}

# Check for conflicts and handle them
if git status | grep -q "both modified: package-lock.json"; then
  handle_package_lock_conflict
else
  handle_other_conflicts
fi
