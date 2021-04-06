#! /bin/bash
g-migration() {
  [[ -z "$1" ]] && { echo "Migration version is required!" ; exit 1; }
  local vnum=$1
  if (($1 < 100)); then
    vnum=0$1
  fi
  touch app/scripts/migrations/"$vnum".js
  cp app/scripts/migrations/template.js app/scripts/migrations/"$vnum".js

  touch app/scripts/migrations/"$vnum".test.js
  cp app/scripts/migrations/template.test.js app/scripts/migrations/"$vnum".test.js
}

g-migration "$1"
