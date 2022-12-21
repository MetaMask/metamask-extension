#! /bin/bash
git ls-files --others --exclude-standard ; git diff-index --name-only --diff-filter=d HEAD ;