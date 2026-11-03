#!/usr/bin/env bash
#
# Resolves mode, dry-run, test channel, Jira bases, and allow-pr-write for
# .github/workflows/release-slack-summaries.yml. Writes GitHub Actions outputs
# to $GITHUB_OUTPUT. Exits 1 on a refused run.
#
# Env:
#   EVENT_NAME, SCHEDULE, INPUT_MODE, INPUT_DRY_RUN, INPUT_TEST_CHANNEL,
#   GA_MODE, TEST_CHANNEL_VAR, BLOCKER_JQL, REGRESSION_JQL, GITHUB_OUTPUT
#
# INPUT_DRY_RUN must be the string from github.event.inputs (not the boolean
# inputs context). Only the exact string "false" turns dry-run off.

set -euo pipefail

if [[ -z "${LC_ALL:-}" ]]; then
  if locale -a 2>/dev/null | grep -qi '^C\.utf-8$'; then
    export LC_ALL=C.UTF-8
  elif locale -a 2>/dev/null | grep -qi '^C\.utf8$'; then
    export LC_ALL=C.utf8
  fi
fi

# Unicode White_Space, including NBSP. Bash [[:space:]] is ASCII in the C
# locale and would leave U+00A0 in place.
whitespace_chars() {
  printf '%s' $'\t\n\v\f\r \u001c\u001d\u001e\u001f\u0085\u00a0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000'
}

strip_all_whitespace() {
  local value="$1"
  local chars="${2:-$(whitespace_chars)}"
  local index char
  for ((index = 0; index < ${#chars}; index++)); do
    char="${chars:index:1}"
    value="${value//"$char"/}"
  done
  printf '%s' "$value"
}

trim_whitespace() {
  local value="$1"
  local chars="${2:-$(whitespace_chars)}"
  local index char changed
  changed=1
  while [[ "$changed" -eq 1 && -n "$value" ]]; do
    changed=0
    for ((index = 0; index < ${#chars}; index++)); do
      char="${chars:index:1}"
      if [[ "$value" == "$char"* ]]; then
        value="${value#"$char"}"
        changed=1
      fi
      if [[ -n "$value" && "$value" == *"$char" ]]; then
        value="${value%"$char"}"
        changed=1
      fi
    done
  done
  printf '%s' "$value"
}

die() {
  echo "::error::$*" >&2
  exit 1
}

is_real_release_channel() {
  local channel="${1,,}"
  [[ "$channel" == '#release-'* || "$channel" == 'release-'* ]]
}

event_name="${EVENT_NAME:-}"
schedule="${SCHEDULE:-}"
input_mode="${INPUT_MODE:-}"
input_dry_run="${INPUT_DRY_RUN:-}"
input_test_channel="${INPUT_TEST_CHANNEL:-}"
ga_mode="${GA_MODE:-}"
default_test_channel="${TEST_CHANNEL_VAR:-}"
blocker_jql="$(trim_whitespace "${BLOCKER_JQL:-}")"
regression_jql="$(trim_whitespace "${REGRESSION_JQL:-}")"
spaces="$(whitespace_chars)"

if [[ "$event_name" == "workflow_dispatch" ]]; then
  mode="$input_mode"
  # github.event.inputs.dry-run is the string "true" or "false".
  # A boolean inputs.dry-run combined with `|| ''` becomes empty when
  # the checkbox is unchecked, which would look like "not false".
  if [[ "$input_dry_run" == "false" ]]; then
    dry_run=false
  else
    dry_run=true
  fi
elif [[ "$event_name" == "schedule" ]]; then
  dry_run=false
  # Quoted so `*` is literal, not a glob.
  case "$schedule" in
    '16 10 * * 1-5')
      mode="blocker-summary"
      ;;
    '21 10 * * 1-5')
      mode="release-validation"
      ;;
    *)
      die "Unexpected schedule: ${schedule}"
      ;;
  esac
else
  die "Unexpected event: ${event_name}"
fi

case "$mode" in
  blocker-summary | release-validation) ;;
  *)
    die "mode must be blocker-summary or release-validation"
    ;;
esac

input_channel="$(strip_all_whitespace "$input_test_channel" "$spaces")"
variable_channel="$(strip_all_whitespace "$default_test_channel" "$spaces")"

# A value that is only whitespace was supplied. Do not treat it as unset:
# the action trims and then posts to the real release channel.
if [[ "$event_name" == "workflow_dispatch" && -n "$input_test_channel" && -z "$input_channel" ]]; then
  die "test-channel is blank after removing whitespace. Refusing to fall back to a real release channel."
fi
if [[ -n "$default_test_channel" && -z "$variable_channel" ]]; then
  die "RELEASE_SUMMARY_TEST_CHANNEL is blank after removing whitespace. Refusing to fall back to a real release channel."
fi

test_channel=""
if [[ "$event_name" == "workflow_dispatch" && -n "$input_channel" ]]; then
  test_channel="$input_channel"
elif [[ "$ga_mode" != "live" ]]; then
  test_channel="$variable_channel"
fi

if [[ "$ga_mode" != "live" && -n "$test_channel" ]] && is_real_release_channel "$test_channel"; then
  die "GA_MODE is not live and the test channel (${test_channel}) is a real release channel. Refusing to post."
fi

# Exact "live" is the only value that may reach real release channels.
if [[ "$ga_mode" != "live" && -z "$test_channel" ]]; then
  echo "::warning::GA_MODE is not live and no test channel is set; forcing dry-run so nothing is posted." >&2
  dry_run=true
fi

# The shared action rewrites a PR only when allow-pr-write is true, dry-run
# is false, and test-channel is empty. This caller also refuses the write
# whenever a test channel is set, including when GA_MODE=live, so a parallel
# Zap 597 run is the only writer.
allow_pr_write=false
if [[ "$ga_mode" == "live" && "$dry_run" == "false" && -z "$test_channel" && "$mode" == "release-validation" ]]; then
  allow_pr_write=true
fi

# A live post with an empty blocker base makes the action skip blockers and
# say there are none. An empty regression base makes it use the action's
# Found-in project-list default. Both are refused.
if [[ "$ga_mode" == "live" && "$dry_run" == "false" ]]; then
  if [[ -z "$blocker_jql" ]]; then
    die "GA_MODE=live and this run is not a dry run, but the blocker JQL is empty. Refusing to post a summary that skips blockers."
  fi
  if [[ -z "$regression_jql" ]]; then
    die "GA_MODE=live and this run is not a dry run, but the regression JQL is empty. Refusing to post using the action's default regression query."
  fi
fi

concurrency_key="release-slack-summaries-${mode}"

if [[ -z "${GITHUB_OUTPUT:-}" ]]; then
  die "GITHUB_OUTPUT is not set"
fi

{
  echo "mode=${mode}"
  echo "dry-run=${dry_run}"
  echo "allow-pr-write=${allow_pr_write}"
  echo "test-channel=${test_channel}"
  echo "concurrency-key=${concurrency_key}"
  echo "blocker-jql<<__RELEASE_SLACK_BLOCKER_JQL__"
  printf '%s\n' "$blocker_jql"
  echo "__RELEASE_SLACK_BLOCKER_JQL__"
  echo "regression-jql<<__RELEASE_SLACK_REGRESSION_JQL__"
  printf '%s\n' "$regression_jql"
  echo "__RELEASE_SLACK_REGRESSION_JQL__"
} >> "$GITHUB_OUTPUT"

if [[ -n "$test_channel" ]]; then
  echo "Resolved test-channel=${test_channel}"
else
  echo "Resolved test-channel is unset"
fi
echo "Resolved mode=${mode} dry-run=${dry_run} allow-pr-write=${allow_pr_write} ga-mode=${ga_mode:-<unset>} concurrency-key=${concurrency_key}"
