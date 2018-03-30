#!/bin/bash

CIRCLE_PR_NUMBER="${CIRCLE_PR_NUMBER:-${CIRCLE_PULL_REQUEST##*/}}"
SHORT_SHA1=$(echo $CIRCLE_SHA1 | cut -c 1-7)
BUILD_LINK_BASE="https://$CIRCLE_BUILD_NUM-42009758-gh.circle-artifacts.com/0"
VERSION=$(node -p 'require("./dist/chrome/manifest.json").version')

MASCARA="$BUILD_LINK_BASE/builds/mascara/home.html"
CHROME="$BUILD_LINK_BASE/builds/metamask-chrome-$VERSION.zip"
FIREFOX="$BUILD_LINK_BASE/builds/metamask-firefox-$VERSION.zip"
EDGE="$BUILD_LINK_BASE/builds/metamask-edge-$VERSION.zip"
OPERA="$BUILD_LINK_BASE/builds/metamask-opera-$VERSION.zip"
WALKTHROUGH="$BUILD_LINK_BASE/test-artifacts/screens/walkthrough%20%28en%29.gif"

read -d '' COMMENT_BODY <<EOF
<details>
  <summary>
    Builds ready [$SHORT_SHA1]:
    <a href=\"$MASCARA\">mascara</a>,
    <a href=\"$CHROME\">chrome</a>,
    <a href=\"$FIREFOX\">firefox</a>,
    <a href=\"$EDGE\">edge</a>,
    <a href=\"$OPERA\">opera</a>
  </summary>
  <image src=\"$WALKTHROUGH\">
</details>
EOF

JSON_PAYLOAD="{\"body\":\"$COMMENT_BODY\"}"
POST_COMMENT_URI="https://api.github.com/repos/metamask/metamask-extension/issues/$CIRCLE_PR_NUMBER/comments"
echo "Announcement:"
echo "$COMMENT_BODY"
echo "Posting to $POST_COMMENT_URI"
curl -d "$JSON_PAYLOAD" -H "Authorization: token $GITHUB_COMMENT_TOKEN" $POST_COMMENT_URI
