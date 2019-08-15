#! /bin/bash

[[ -z "$1" ]] && { echo "Migration version is required!" ; exit 1; }

touch app/scripts/migrations/$1.js
cp ls app/scripts/migrations/template.js app/scripts/migrations/$1.js

touch test/unit/migrations/$1.js
cp test/unit/migrations/template.js test/unit/migrations/$1.js
