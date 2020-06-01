#!/usr/bin/env bash

set -x
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

function upload_bundles {
  local release="${1}"; shift

  for filepath in ./dist/chrome/*.js
  do
    if [[ -f $filepath ]]
    then
      upload_bundle "${release}" "${filepath}"
    fi
  done
}

function upload_bundle {
  local release="${1}"; shift
  local filepath="${1}"; shift
  local filename

  filename="$( basename "${filepath}" )"

  printf 'Uploading %s\n' "${filename}"
  sentry-cli releases --org 'metamask' --project 'metamask' files "${release}" upload "${filepath}" "metamask/${filename}"
}

function upload_sourcemaps {
  local release="${1}"; shift

  sentry-cli releases --org 'metamask' --project 'metamask' files "${release}" upload-sourcemaps ./dist/sourcemaps/ --url-prefix 'sourcemaps'
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
  fi

  printf 'uploading source files Sentry release "%s"...\n' "${release}"
  upload_bundles "${release}"
  printf 'uploading sourcemaps Sentry release "%s"...\n' "${release}"
  upload_sourcemaps "${release}"
  printf 'all done!\n'
}

main "${@}"
