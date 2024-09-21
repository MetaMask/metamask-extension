#! /bin/bash
# This file exists because yarn 2+ seems to not be able to use the yarn 1
# syntax in "scripts" to concatenate two commands output together using { }.
# This script simply outputs both and then normal pipe operator syntax can be
# used in the "scripts" key can be used to operate on the output.

git ls-files --others --exclude-standard ; git diff-index --name-only --diff-filter=d HEAD ;
