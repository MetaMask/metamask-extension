# DESCRIPTION
#
# This script will print out all of the CHANGELOG.md lines for a given version
# with the assumption that the CHANGELOG.md files looks something along the
# lines of:
#
# ```
# ## 6.6.2 Fri Jun 07 2019
#
# - [#6690](https://github.com/MetaMask/metamask-extension/pull/6690): Some words
# - [#6700](https://github.com/MetaMask/metamask-extension/pull/6700): some more words
#
# ## 6.6.1 Thu Jun 06 2019
#
# - [#6691](https://github.com/MetaMask/metamask-extension/pull/6691): Revert other words
#
# ## 6.6.0 Mon Jun 03 2019
#
# - [#6659](https://github.com/MetaMask/metamask-extension/pull/6659): foo
# - [#6671](https://github.com/MetaMask/metamask-extension/pull/6671): bar
# - [#6625](https://github.com/MetaMask/metamask-extension/pull/6625): baz
# - [#6633](https://github.com/MetaMask/metamask-extension/pull/6633): Many many words
#
#
# ```
#
# EXAMPLE
#
# Run this script like so, passing in the version:
#
# ```
# awk -v version='6.6.0' -f .github/scripts/show-changelog.awk CHANGELOG.md
# ```
#

BEGIN {
    inside_section = 0;
}

$1 == "##" && $2 == version {
    inside_section = 1;
    next;
}

$1 == "##" && $2 != version {
    inside_section = 0;
    next;
}

inside_section && !/^$/ {
    print $0;
}
