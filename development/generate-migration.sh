#! /bin/bash

validate-number(){
  re='^[0-9]+$'
  if [[ ! $1 =~ $re ]]; then
    echo "Error: The value must be a number." >&2
    exit 1
  fi
}

g-migration() {
  [[ -z "$1" ]] && { echo "Migration version is required!" ; exit 1; }
  local vnum=$1

  validate-number "$vnum"

  if (($1 < 100)); then
    vnum=0$1
  fi
  touch app/scripts/migrations/"$vnum".ts
  cp app/scripts/migrations/template.ts app/scripts/migrations/"$vnum".ts

  touch app/scripts/migrations/"$vnum".test.js
  cp app/scripts/migrations/template.test.js app/scripts/migrations/"$vnum".test.js
}

g-migration "$1"
