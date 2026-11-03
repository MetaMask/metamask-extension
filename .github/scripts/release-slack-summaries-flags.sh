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

# Removed everywhere. JavaScript trim() drops U+FEFF from the ends, so a
# leading BOM survives a hand-listed trim and then disappears in the action.
# U+200B, U+2060, and U+180E are not part of a Slack name either.
invisible_chars() {
  printf '%s' $'\u180e\u200b\u2060\ufeff'
}

# End-trim set matching JavaScript TrimString (WhiteSpace + LineTerminator),
# including NBSP. Internal spaces stay so "#qa test" fails the allowlist.
js_trim_chars() {
  printf '%s' $'\t\n\v\f\r \u001c\u001d\u001e\u001f\u0085\u00a0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000\ufeff'
}

strip_chars() {
  local value="$1"
  local chars="$2"
  local index char
  for ((index = 0; index < ${#chars}; index++)); do
    char="${chars:index:1}"
    value="${value//"$char"/}"
  done
  printf '%s' "$value"
}

trim_chars() {
  local value="$1"
  local chars="$2"
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

# Drop invisible characters anywhere, then trim JavaScript whitespace on the
# ends. A value that is only those characters becomes empty.
normalize_text() {
  local value="$1"
  value="$(strip_chars "$value" "$(invisible_chars)")"
  value="$(trim_chars "$value" "$(js_trim_chars)")"
  printf '%s' "$value"
}

# Slack channel name, optional leading #. Slack ID: C, G, or D plus 8+.
is_slack_name() {
  local name_pattern='^#?[a-z0-9][a-z0-9._-]{0,79}$'
  [[ "$1" =~ $name_pattern ]]
}

is_slack_id() {
  local id_pattern='^[CGD][A-Z0-9]{8,}$'
  [[ "$1" =~ $id_pattern ]]
}

is_allowed_channel() {
  is_slack_name "$1" || is_slack_id "$1"
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
raw_blocker_jql="${BLOCKER_JQL:-}"
raw_regression_jql="${REGRESSION_JQL:-}"
# Preview only. A live post with no test channel must not use these.
preview_blocker_jql='type = Bug AND labels = "release-blocker" AND statusCategory != Done'
preview_regression_jql='type = Bug AND statusCategory != Done'

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

input_channel="$(normalize_text "$input_test_channel")"
variable_channel="$(normalize_text "$default_test_channel")"

# Supplied but blank after normalization. JavaScript trim() would also make
# this empty and then post to the real release channel.
if [[ "$event_name" == "workflow_dispatch" && -n "$input_test_channel" && -z "$input_channel" ]]; then
  die "test-channel is blank after normalization. Refusing to fall back to a real release channel."
fi
if [[ -n "$default_test_channel" && -z "$variable_channel" ]]; then
  die "RELEASE_SUMMARY_TEST_CHANNEL is blank after normalization. Refusing to fall back to a real release channel."
fi

# Validate both supplied values before choosing one. A live run does not
# use the repository variable as the post target, but a release-* value
# there must not be ignored: that would leave test-channel empty and post
# to the real channel.
if [[ -n "$input_channel" ]]; then
  if ! is_allowed_channel "$input_channel"; then
    die "test channel (${input_channel}) is not a Slack channel name or ID."
  fi
  if is_real_release_channel "$input_channel"; then
    die "The test channel (${input_channel}) names a real release channel. Refusing to post."
  fi
fi
if [[ -n "$variable_channel" ]]; then
  if ! is_allowed_channel "$variable_channel"; then
    die "RELEASE_SUMMARY_TEST_CHANNEL (${variable_channel}) is not a Slack channel name or ID."
  fi
  if is_real_release_channel "$variable_channel"; then
    die "RELEASE_SUMMARY_TEST_CHANNEL (${variable_channel}) names a real release channel. Refusing to post."
  fi
fi

test_channel=""
if [[ "$event_name" == "workflow_dispatch" && -n "$input_channel" ]]; then
  test_channel="$input_channel"
elif [[ "$ga_mode" != "live" ]]; then
  test_channel="$variable_channel"
fi

if [[ -n "$test_channel" ]] && ! is_allowed_channel "$test_channel"; then
  die "test channel (${test_channel}) is not a Slack channel name or ID."
fi

# release-* is rejected in every mode, including live. A live post to the
# real channels happens only when no test channel is set. The check runs
# on the normalized value so a leading U+FEFF cannot hide the name.
if [[ -n "$test_channel" ]] && is_real_release_channel "$test_channel"; then
  die "The test channel (${test_channel}) names a real release channel. Refusing to post."
fi

# A channel ID can be a real release channel with no "release-" in the name.
# When GA_MODE is not live, accept an ID only if it is the configured test
# channel variable. Other non-live channels must be a #name or name.
if [[ "$ga_mode" != "live" && -n "$test_channel" ]] && is_slack_id "$test_channel"; then
  if [[ "$test_channel" != "$variable_channel" ]]; then
    die "GA_MODE is not live, so a Slack channel ID is accepted only when it equals RELEASE_SUMMARY_TEST_CHANNEL."
  fi
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

# A newline in a JQL value can close a heredoc early and inject later
# outputs. Refuse it, then write a single key=value line.
if [[ "$raw_blocker_jql" == *$'\n'* || "$raw_blocker_jql" == *$'\r'* ]]; then
  die "RELEASE_SUMMARY_BLOCKER_JQL contains a newline or carriage return."
fi
if [[ "$raw_regression_jql" == *$'\n'* || "$raw_regression_jql" == *$'\r'* ]]; then
  die "RELEASE_SUMMARY_REGRESSION_JQL contains a newline or carriage return."
fi

blocker_jql="$(normalize_text "$raw_blocker_jql")"
regression_jql="$(normalize_text "$raw_regression_jql")"

# An empty blocker base makes the action skip the blocker section. It does
# not by itself print "No remaining bugs"; that line is used only when a
# query ran and the merged bug list is empty. An empty regression base makes
# the action use its Found-in project-list default. A live post with no test
# channel requires both repository variables. Dry runs and test-channel runs
# may preview with the built-in bases when the variables are empty.
if [[ "$ga_mode" == "live" && "$dry_run" == "false" && -z "$test_channel" ]]; then
  if [[ -z "$blocker_jql" ]]; then
    die "GA_MODE=live and this run is not a dry run, but RELEASE_SUMMARY_BLOCKER_JQL is empty. Refusing to post a summary that skips blockers."
  fi
  if [[ -z "$regression_jql" ]]; then
    die "GA_MODE=live and this run is not a dry run, but RELEASE_SUMMARY_REGRESSION_JQL is empty. Refusing to post using the action's default regression query."
  fi
else
  if [[ -z "$blocker_jql" ]]; then
    blocker_jql="$preview_blocker_jql"
  fi
  if [[ -z "$regression_jql" ]]; then
    regression_jql="$preview_regression_jql"
  fi
fi

concurrency_key="release-slack-summaries-${mode}"

if [[ -z "${GITHUB_OUTPUT:-}" ]]; then
  die "GITHUB_OUTPUT is not set"
fi

# JQL first, safety flags last, so a crafted JQL value cannot overwrite them.
{
  echo "blocker-jql=${blocker_jql}"
  echo "regression-jql=${regression_jql}"
  echo "concurrency-key=${concurrency_key}"
  echo "mode=${mode}"
  echo "dry-run=${dry_run}"
  echo "allow-pr-write=${allow_pr_write}"
  echo "test-channel=${test_channel}"
} >> "$GITHUB_OUTPUT"

if [[ -n "$test_channel" ]]; then
  echo "Resolved test-channel=${test_channel}"
else
  echo "Resolved test-channel is unset"
fi
echo "Resolved mode=${mode} dry-run=${dry_run} allow-pr-write=${allow_pr_write} ga-mode=${ga_mode:-<unset>} concurrency-key=${concurrency_key}"
