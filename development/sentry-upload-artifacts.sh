#!/usr/bin/env bash

set -e
set -u
set -o pipefail

readonly __SCRIPT_NAME__="${0##*/}"
readonly __SEE_HELP_MESSAGE__="See '${__SCRIPT_NAME__} --help' for more information."

function die {
  local message="${1}"

  printf 'ERROR: %s\n' "${message}" >&2

  exit 1
}

function show_help {
  cat << EOF
${__SCRIPT_NAME__}"
Upload JavaScript bundles and sourcemaps to Sentry

Options:
  -h, --help               Show help text
  -r, --release <release>  Sentry release to upload files to (defaults to 'VERSION' environment variable)
EOF
}

function upload_sourcemaps {
  local release="${1}"; shift

  sentry-cli releases files "${release}" upload-sourcemaps ./dist/chrome/*.js ./dist/sourcemaps/ --rewrite --url-prefix 'metamask'
}

function main {
  local release=VERSION

  while :; do
    case "${1-default}" in
      -h|--help)
        show_help
        exit
        ;;
      -r|--release)
        if [[ -z $2 ]]
        then
          printf "'release' option requires an argument.\\n" >&2
          printf '%s\n' "${__SEE_HELP_MESSAGE__}" >&2
          exit 1
        fi
        release="${2}"
        shift
        ;;
      *)
        break
    esac

    shift
  done

  if [[ -z $release ]]
  then
    die 'Required parameter "release" missing; either include parameter or set VERSION environment variable'
  elif [[ -z $SENTRY_ORG ]]
  then
    die 'Required environment variable "SENTRY_ORG" missing'
  elif  [[ -z $SENTRY_PROJECT ]]
  then
    die 'Required environment variable "SENTRY_PROJECT" missing'
  fi

  printf 'uploading source files and sourcemaps for Sentry release "%s"...\n' "${release}"
  upload_sourcemaps "${release}"
  printf 'all done!\n'
}

main "${@}"
