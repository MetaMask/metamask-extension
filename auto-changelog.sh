#! /bin/bash
git fetch --tags
URL="https://github.com/MetaMask/metamask-extension/pull/"
LOG=$(git log $(git describe --tags $(git rev-list --tags --max-count=1))..HEAD --pretty="%s::%b"  --reverse --grep="Merge pull request #" --grep="(#");
while read -r line; do
    SUBJECT="$(echo $line | sed -E  's/(.*):{2}(.*)/\1/')"
    PR=$(echo $SUBJECT | sed 's/^.*(#\([^&]*\)).*/\1/' | sed 's/^.*#\([^&]*\) from.*/\1/')
    if [ -z "$(echo $line | sed -E  's/(.*):{2}(.*)/\2/')" ]; then
        MESSAGE=$(echo $SUBJECT | sed "s/(#$PR)//g"); else
        MESSAGE=$(echo $line | sed -E  's/(.*):{2}(.*)/\2/') 
    fi
    sed -i "/## Current Develop Branch/a - [#$PR]($URL$PR): $MESSAGE" CHANGELOG.md;
done <<< "$LOG"
echo "CHANGELOG updated"
