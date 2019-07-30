#! /bin/bash

[[ -z "$1" ]] && { echo "Rollback version is required!" ; exit 1; }
echo "Rolling back to version $1"

# Checkout branch to increment version
git checkout -b version-increment-$1
yarn version:bump patch

# Store the new version name
NEW_VERSION=$(cat app/manifest.json | jq -r .version)

# Make sure origin tags are loaded
git fetch origin

# check out the rollback branch
git checkout origin/v$1

# Create the rollback branch.
git checkout -b Version-$NEW_VERSION-Rollback-to-$1

# Set the version files to the next one.
git checkout master CHANGELOG.md
git checkout master app/manifest.json
git commit -m "Version $NEW_VERSION (Rollback to $1)"

# Push the new branch to PR
git push -u origin HEAD

# Create tag and push that up too
git tag v${NEW_VERSION}
git push origin v${NEW_VERSION}

# Cleanup version branch
git branch -D version-increment-$1
