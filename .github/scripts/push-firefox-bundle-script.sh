#!/usr/bin/env bash

set -e
set -o pipefail

if [[ -z "${FIREFOX_BUNDLE_SCRIPT_TOKEN}" ]]; then
    echo "::error::FIREFOX_BUNDLE_SCRIPT_TOKEN not provided. Set the 'FIREFOX_BUNDLE_SCRIPT_TOKEN' environment variable."
    exit 1
fi

if [[ -z "${RELEASE_TAG:-}" ]]; then
    echo "::error::RELEASE_TAG not provided."
    exit 1
fi

git config --global user.name "MetaMask Bot"
git config --global user.email metamaskbot@users.noreply.github.com

rawVersion="${RELEASE_TAG#v}"

version="v${rawVersion}"

# Validate that the version was successfully extracted
if [[ -z "${rawVersion}" ]]; then
    echo "::error::Failed to extract version from RELEASE_TAG='${RELEASE_TAG}'. Expected format: 'vX.Y.Z'."
    exit 1
fi

echo "Version extracted: ${version}"

git clone "https://${FIREFOX_BUNDLE_SCRIPT_TOKEN}@github.com/MetaMask/firefox-bundle-script.git"
cd firefox-bundle-script
git checkout release
cp ../.github/scripts/bundle.sh ./bundle.sh

# sed works differently on macOS and Linux
# macOS requires an empty string argument for -i
# so we need to handle this case based on the OS
if sed --version 2> /dev/null | grep -q GNU; then
    SED_OPTS=(-i)
else
    SED_OPTS=(-i '')
fi

# Insert exported environment variables
awk -F '=' '/^\s*export / {gsub(/^export /, ""); print $1}' bundle.sh | while read -r var; do
    if [[ -n "${!var}" ]]; then
        sed "${SED_OPTS[@]}" "s|^\(\s*export ${var}=\).*|\1\"${!var}\"|" bundle.sh
    fi
done

git add bundle.sh
git commit --allow-empty -m "${version}"
git push origin release

# Per-release tag so prepare_release.sh can fetch bundle.sh at v{X.Y.Z}
# instead of release branch HEAD (INFRA-3753). Check origin (the source of
# truth) rather than a local tag that `git clone` may have pulled: a stale
# local tag would otherwise keep pointing at an old commit. When the tag is
# not yet on origin, create it at the commit made above and let any push
# failure surface instead of masking it as a benign re-run.
# Peel annotated tags to a single commit SHA (refs/tags/X^{}); without ^{},
# ls-remote can return multiple lines for one annotated tag.
remote_tag_sha="$(git ls-remote --tags origin "refs/tags/${version}^{}" | awk 'NR==1 { print $1; exit }')"
if [[ -n "${remote_tag_sha}" ]]; then
  echo "Tag ${version} already exists on origin (${remote_tag_sha}); leaving immutable release tag untouched"
else
  git tag -a "${version}" -m "${version}"
  git push origin "refs/tags/${version}"
  echo "Pushed tag ${version}"
fi
