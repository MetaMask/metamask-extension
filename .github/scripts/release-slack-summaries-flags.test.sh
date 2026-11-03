#!/usr/bin/env bash
# Exercises .github/scripts/release-slack-summaries-flags.sh.
# Run: bash .github/scripts/release-slack-summaries-flags.test.sh

set -euo pipefail

if locale -a 2>/dev/null | grep -qi '^C\.utf-8$'; then
  export LC_ALL=C.UTF-8
elif locale -a 2>/dev/null | grep -qi '^C\.utf8$'; then
  export LC_ALL=C.utf8
fi

root="$(cd "$(dirname "$0")/../.." && pwd)"
script="${root}/.github/scripts/release-slack-summaries-flags.sh"
workflow="${root}/.github/workflows/release-slack-summaries.yml"
blocker_default='type = Bug AND labels = "release-blocker" AND statusCategory != Done'
regression_default='type = Bug AND statusCategory != Done'
nbsp=$'\u00a0'
failures=0
passed=0

assert_eq() {
  local name="$1" expected="$2" actual="$3"
  if [[ "$expected" == "$actual" ]]; then
    passed=$((passed + 1))
    printf 'ok   %s\n' "$name"
  else
    failures=$((failures + 1))
    printf 'FAIL %s\n  expected: %q\n  actual:   %q\n' "$name" "$expected" "$actual" >&2
  fi
}

# GitHub Actions output parser. key=value and key<<delim are both accepted.
# A later assignment of the same key wins, which is what an injected heredoc
# would rely on.
output_value() {
  local file="$1" key="$2"
  local line out_key delim value capturing=""
  local -A found=()
  while IFS= read -r line || [[ -n "$line" ]]; do
    if [[ -n "$capturing" ]]; then
      if [[ "$line" == "$delim" ]]; then
        found["$out_key"]="$value"
        capturing=""
        value=""
      elif [[ -z "${value+x}" || -z "$value" ]]; then
        value="$line"
      else
        value+=$'\n'"$line"
      fi
      continue
    fi
    if [[ "$line" =~ ^([A-Za-z0-9_-]+)\<\<(.*)$ ]]; then
      out_key="${BASH_REMATCH[1]}"
      delim="${BASH_REMATCH[2]}"
      value=""
      capturing=1
      continue
    fi
    if [[ "$line" =~ ^([A-Za-z0-9_-]+)=(.*)$ ]]; then
      found["${BASH_REMATCH[1]}"]="${BASH_REMATCH[2]}"
    fi
  done < "$file"
  printf '%s' "${found[$key]-}"
}

# Runs the flag script. Extra KEY=VALUE pairs are the environment.
# Prints status, then the output file path, on stdout as "status<TAB>path".
# Stderr of the script is left in the path with suffix .err (caller prints it).
run_flags() {
  local out err status
  out="$(mktemp)"
  err="$(mktemp)"
  set +e
  env -i \
    PATH="$PATH" \
    LC_ALL="${LC_ALL:-}" \
    GITHUB_OUTPUT="$out" \
    BLOCKER_JQL="$blocker_default" \
    REGRESSION_JQL="$regression_default" \
    "$@" \
    bash "$script" > /dev/null 2> "$err"
  status=$?
  set -e
  cp "$err" "${out}.err"
  rm -f "$err"
  printf '%s\t%s\n' "$status" "$out"
}

expect_success() {
  local name="$1"
  shift
  local result status path
  result="$(run_flags "$@")"
  status="${result%%$'\t'*}"
  path="${result#*$'\t'}"
  if [[ "$status" -ne 0 ]]; then
    failures=$((failures + 1))
    printf 'FAIL %s (exit %s)\n' "$name" "$status" >&2
    cat "${path}.err" >&2 || true
    rm -f "$path" "${path}.err"
    return
  fi
  printf '%s' "$path"
}

expect_failure() {
  local name="$1"
  shift
  local result status path err
  result="$(run_flags "$@")"
  status="${result%%$'\t'*}"
  path="${result#*$'\t'}"
  err="$(cat "${path}.err" 2>/dev/null || true)"
  if [[ "$status" -eq 0 ]]; then
    failures=$((failures + 1))
    printf 'FAIL %s expected non-zero exit\n  output:\n%s\n' "$name" "$(cat "$path")" >&2
  elif [[ "$err" != *"::error::"* ]]; then
    failures=$((failures + 1))
    printf 'FAIL %s exit %s but stderr has no ::error::\n%s\n' "$name" "$status" "$err" >&2
  elif grep -q '^allow-pr-write=true$' "$path"; then
    failures=$((failures + 1))
    printf 'FAIL %s wrote allow-pr-write=true\n' "$name" >&2
  else
    passed=$((passed + 1))
    printf 'ok   %s\n' "$name"
  fi
  rm -f "$path" "${path}.err"
}

# F1: blank-but-not-empty channels from dispatch and the variable.
blank_names=(space tab lf crlf nbsp)
blank_values=(' ' $'\t' $'\n' $'\r\n' "$nbsp")
for ga_mode in '' test live; do
  for source in dispatch variable; do
    for index in "${!blank_names[@]}"; do
      label="${blank_names[$index]}"
      blank="${blank_values[$index]}"
      if [[ "$source" == "dispatch" ]]; then
        expect_failure "F1 dispatch ${label} ga=${ga_mode:-unset}" \
          EVENT_NAME=workflow_dispatch \
          INPUT_MODE=release-validation \
          INPUT_DRY_RUN=false \
          INPUT_TEST_CHANNEL="$blank" \
          GA_MODE="$ga_mode" \
          TEST_CHANNEL_VAR='#qa-fallback'
      else
        expect_failure "F1 variable ${label} ga=${ga_mode:-unset}" \
          EVENT_NAME=schedule \
          SCHEDULE='21 10 * * 1-5' \
          GA_MODE="$ga_mode" \
          TEST_CHANNEL_VAR="$blank"
      fi
    done
  done
done

# Unset channel, not live: dry-run, no PR write. Not a supplied blank.
path="$(expect_success "setup unset channel" \
  EVENT_NAME=schedule \
  SCHEDULE='16 10 * * 1-5' \
  GA_MODE=test)"
if [[ -n "${path:-}" && -f "$path" ]]; then
  assert_eq "F1 unset channel dry-run" "true" "$(output_value "$path" dry-run)"
  assert_eq "F1 unset channel no write" "false" "$(output_value "$path" allow-pr-write)"
  assert_eq "F1 unset channel empty" "" "$(output_value "$path" test-channel)"
  rm -f "$path" "${path}.err"
fi

# Whitespace around a real test channel is removed before the checks.
path="$(expect_success "setup padded channel" \
  EVENT_NAME=workflow_dispatch \
  INPUT_MODE=blocker-summary \
  INPUT_DRY_RUN=false \
  INPUT_TEST_CHANNEL="${nbsp}#qa-test${nbsp}" \
  GA_MODE=test)"
if [[ -n "${path:-}" && -f "$path" ]]; then
  assert_eq "F1 pad strips to channel" "#qa-test" "$(output_value "$path" test-channel)"
  assert_eq "F1 pad no write" "false" "$(output_value "$path" allow-pr-write)"
  assert_eq "F1 pad posts to test channel" "false" "$(output_value "$path" dry-run)"
  rm -f "$path" "${path}.err"
fi

# F3: live, not a dry run, no blocker JQL.
expect_failure "F3 live missing blocker jql" \
  EVENT_NAME=schedule \
  SCHEDULE='21 10 * * 1-5' \
  GA_MODE=live \
  BLOCKER_JQL='' \
  REGRESSION_JQL="$regression_default"

expect_failure "F3 live whitespace blocker jql" \
  EVENT_NAME=workflow_dispatch \
  INPUT_MODE=release-validation \
  INPUT_DRY_RUN=false \
  GA_MODE=live \
  BLOCKER_JQL=" ${nbsp}" \
  REGRESSION_JQL="$regression_default"

expect_failure "F3 live missing regression jql" \
  EVENT_NAME=schedule \
  SCHEDULE='21 10 * * 1-5' \
  GA_MODE=live \
  BLOCKER_JQL="$blocker_default" \
  REGRESSION_JQL=''

# Live dry-run may proceed with empty JQL because it does not post.
path="$(expect_success "setup live dry-run empty jql" \
  EVENT_NAME=workflow_dispatch \
  INPUT_MODE=release-validation \
  INPUT_DRY_RUN=true \
  GA_MODE=live \
  BLOCKER_JQL='' \
  REGRESSION_JQL='')"
if [[ -n "${path:-}" && -f "$path" ]]; then
  assert_eq "F3 dry-run keeps empty blocker" "true" "$(output_value "$path" dry-run)"
  assert_eq "F3 dry-run no write" "false" "$(output_value "$path" allow-pr-write)"
  rm -f "$path" "${path}.err"
fi

# F5: schedule and dispatch of the same mode share a concurrency key.
path_sched="$(expect_success "setup sched validation key" \
  EVENT_NAME=schedule \
  SCHEDULE='21 10 * * 1-5' \
  GA_MODE=live)"
path_disp="$(expect_success "setup dispatch validation key" \
  EVENT_NAME=workflow_dispatch \
  INPUT_MODE=release-validation \
  INPUT_DRY_RUN=false \
  GA_MODE=live)"
if [[ -n "${path_sched:-}" && -f "$path_sched" && -n "${path_disp:-}" && -f "$path_disp" ]]; then
  assert_eq "F5 same mode key" \
    "$(output_value "$path_sched" concurrency-key)" \
    "$(output_value "$path_disp" concurrency-key)"
  assert_eq "F5 key is release-validation" \
    "release-slack-summaries-release-validation" \
    "$(output_value "$path_sched" concurrency-key)"
  rm -f "$path_sched" "${path_sched}.err" "$path_disp" "${path_disp}.err"
fi

group_line="$(grep -E '^[[:space:]]*group:' "$workflow")"
if [[ "$group_line" == *github.run_id* ]]; then
  failures=$((failures + 1))
  printf 'FAIL F5 workflow concurrency group still includes github.run_id\n%s\n' "$group_line" >&2
else
  passed=$((passed + 1))
  printf 'ok   F5 workflow group has no github.run_id\n'
fi
if grep -q "github.event.schedule == '16 10 \\* \\* 1-5' && 'blocker-summary'" "$workflow" \
  && grep -q "github.event.schedule == '21 10 \\* \\* 1-5' && 'release-validation'" "$workflow"; then
  passed=$((passed + 1))
  printf 'ok   F5 workflow maps both crons to the same mode keys\n'
else
  failures=$((failures + 1))
  printf 'FAIL F5 workflow concurrency expression does not map both crons\n' >&2
fi

# F7
expect_failure "F7 non-live hash release channel" \
  EVENT_NAME=workflow_dispatch \
  INPUT_MODE=release-validation \
  INPUT_DRY_RUN=false \
  INPUT_TEST_CHANNEL='#release-extension-13-56-0' \
  GA_MODE=test
expect_failure "F7 non-live bare release channel" \
  EVENT_NAME=workflow_dispatch \
  INPUT_MODE=blocker-summary \
  INPUT_DRY_RUN=false \
  INPUT_TEST_CHANNEL='release-extension-13-56-0' \
  GA_MODE=''

# Regressions.
path="$(expect_success "setup blocker schedule" \
  EVENT_NAME=schedule \
  SCHEDULE='16 10 * * 1-5' \
  GA_MODE=live)"
if [[ -n "${path:-}" && -f "$path" ]]; then
  assert_eq "schedule 16 is blocker-summary" "blocker-summary" "$(output_value "$path" mode)"
  assert_eq "schedule 16 no pr write" "false" "$(output_value "$path" allow-pr-write)"
  rm -f "$path" "${path}.err"
fi

path="$(expect_success "setup validation schedule" \
  EVENT_NAME=schedule \
  SCHEDULE='21 10 * * 1-5' \
  GA_MODE=live)"
if [[ -n "${path:-}" && -f "$path" ]]; then
  assert_eq "schedule 21 is release-validation" "release-validation" "$(output_value "$path" mode)"
  assert_eq "schedule 21 live writes" "true" "$(output_value "$path" allow-pr-write)"
  assert_eq "schedule 21 passes blocker jql" "$blocker_default" "$(output_value "$path" blocker-jql)"
  rm -f "$path" "${path}.err"
fi

expect_failure "unknown schedule" \
  EVENT_NAME=schedule \
  SCHEDULE='16 10 0 * 1-5'
expect_failure "unknown event" \
  EVENT_NAME=push

path="$(expect_success "setup dry-run false string" \
  EVENT_NAME=workflow_dispatch \
  INPUT_MODE=release-validation \
  INPUT_DRY_RUN=false \
  GA_MODE=live)"
if [[ -n "${path:-}" && -f "$path" ]]; then
  assert_eq "exact false is not a dry run" "false" "$(output_value "$path" dry-run)"
  rm -f "$path" "${path}.err"
fi

for value in '' true True FALSE 'false '; do
  path="$(expect_success "setup dry-run value ${value:-empty}" \
    EVENT_NAME=workflow_dispatch \
    INPUT_MODE=blocker-summary \
    INPUT_DRY_RUN="$value" \
    INPUT_TEST_CHANNEL='#qa-test' \
    GA_MODE=test)"
  if [[ -n "${path:-}" && -f "$path" ]]; then
    assert_eq "dry-run stays on for ${value:-empty}" "true" "$(output_value "$path" dry-run)"
    rm -f "$path" "${path}.err"
  fi
done

path="$(expect_success "setup live test channel" \
  EVENT_NAME=workflow_dispatch \
  INPUT_MODE=release-validation \
  INPUT_DRY_RUN=false \
  INPUT_TEST_CHANNEL='#qa-test' \
  GA_MODE=live)"
if [[ -n "${path:-}" && -f "$path" ]]; then
  assert_eq "live test channel no write" "false" "$(output_value "$path" allow-pr-write)"
  assert_eq "live test channel kept" "#qa-test" "$(output_value "$path" test-channel)"
  rm -f "$path" "${path}.err"
fi

# Workflow wiring: an unchecked boolean inputs.dry-run is false, and
# `false || ''` is empty. The step must read the event payload string.
dry_run_line="$(grep -E '^[[:space:]]*INPUT_DRY_RUN:' "$workflow")"
event_inputs_marker='github.event.inputs.dry-run'
bare_inputs_marker='inputs.dry-run'
dry_run_without_event="${dry_run_line//$event_inputs_marker/}"
if [[ "$dry_run_line" == *"$event_inputs_marker"* && "$dry_run_without_event" != *"$bare_inputs_marker"* ]]; then
  passed=$((passed + 1))
  printf 'ok   dry-run uses github.event.inputs string\n'
else
  failures=$((failures + 1))
  printf 'FAIL workflow dry-run input is not the event string\n%s\n' "$dry_run_line" >&2
fi

sha='f99347bfb23bbbd352d199be7b58b3d7cb9f9bb9'
if grep -q "release-slack-summaries@${sha}" "$workflow" \
  && grep -q "github-tools-ref: ${sha}" "$workflow" \
  && ! grep -q 'release-slack-summaries@cursor/' "$workflow"; then
  passed=$((passed + 1))
  printf 'ok   F2 uses and github-tools-ref are pinned to %s\n' "$sha"
else
  failures=$((failures + 1))
  printf 'FAIL F2 workflow is not pinned to %s\n' "$sha" >&2
fi

if grep -q 'jira-release-blocker-jql:' "$workflow" \
  && grep -q 'jira-regression-jql:' "$workflow" \
  && grep -q 'labels = "release-blocker"' "$script" \
  && ! grep -q 'RELEASE_SUMMARY_BLOCKER_JQL ||' "$workflow"; then
  passed=$((passed + 1))
  printf 'ok   F3 workflow passes blocker and regression JQL\n'
else
  failures=$((failures + 1))
  printf 'FAIL F3 workflow does not pass both JQL inputs\n' >&2
fi

# F1 round 2: characters JavaScript trim() or a zero-width char can hide.
fef=$'\ufeff'
zwsp=$'\u200b'
word_joiner=$'\u2060'
f1_round2_names=(fef zwsp word-joiner fef-release spaces-fef)
f1_round2_values=("$fef" "$zwsp" "$word_joiner" "${fef}#release-extension-13-53-0" " ${fef} ")
for ga_mode in '' test live; do
  for source in dispatch variable; do
    for index in "${!f1_round2_names[@]}"; do
      label="${f1_round2_names[$index]}"
      blank="${f1_round2_values[$index]}"
      if [[ "$source" == "dispatch" ]]; then
        expect_failure "F1 r2 dispatch ${label} ga=${ga_mode:-unset}" \
          EVENT_NAME=workflow_dispatch \
          INPUT_MODE=release-validation \
          INPUT_DRY_RUN=false \
          INPUT_TEST_CHANNEL="$blank" \
          GA_MODE="$ga_mode"
      else
        expect_failure "F1 r2 variable ${label} ga=${ga_mode:-unset}" \
          EVENT_NAME=schedule \
          SCHEDULE='21 10 * * 1-5' \
          GA_MODE="$ga_mode" \
          TEST_CHANNEL_VAR="$blank"
      fi
    done
  done
done

expect_failure "F1 allowlist internal space" \
  EVENT_NAME=workflow_dispatch \
  INPUT_MODE=blocker-summary \
  INPUT_DRY_RUN=false \
  INPUT_TEST_CHANNEL='#qa test' \
  GA_MODE=test
expect_failure "F1 allowlist path" \
  EVENT_NAME=workflow_dispatch \
  INPUT_MODE=blocker-summary \
  INPUT_DRY_RUN=false \
  INPUT_TEST_CHANNEL='qa/../x' \
  GA_MODE=test

# F3 round 2: live posts require the repository variables themselves.
expect_failure "F3 r2 live unset jql" \
  EVENT_NAME=schedule \
  SCHEDULE='21 10 * * 1-5' \
  GA_MODE=live \
  BLOCKER_JQL= \
  REGRESSION_JQL=
expect_failure "F3 r2 live fef jql" \
  EVENT_NAME=schedule \
  SCHEDULE='21 10 * * 1-5' \
  GA_MODE=live \
  BLOCKER_JQL="$fef" \
  REGRESSION_JQL="$fef"

path="$(expect_success "setup F3 r2 live real jql" \
  EVENT_NAME=schedule \
  SCHEDULE='21 10 * * 1-5' \
  GA_MODE=live \
  BLOCKER_JQL='type = Bug AND labels = "release-blocker"' \
  REGRESSION_JQL='type = Bug AND labels = "regression"')"
if [[ -n "${path:-}" && -f "$path" ]]; then
  assert_eq "F3 r2 outputs blocker" 'type = Bug AND labels = "release-blocker"' "$(output_value "$path" blocker-jql)"
  assert_eq "F3 r2 outputs regression" 'type = Bug AND labels = "regression"' "$(output_value "$path" regression-jql)"
  assert_eq "F3 r2 live still writes" "true" "$(output_value "$path" allow-pr-write)"
  rm -f "$path" "${path}.err"
fi

path="$(expect_success "setup F3 r2 dry-run preview" \
  EVENT_NAME=workflow_dispatch \
  INPUT_MODE=release-validation \
  INPUT_DRY_RUN=true \
  GA_MODE=live \
  BLOCKER_JQL= \
  REGRESSION_JQL=)"
if [[ -n "${path:-}" && -f "$path" ]]; then
  assert_eq "F3 r2 dry-run preview blocker" "$blocker_default" "$(output_value "$path" blocker-jql)"
  assert_eq "F3 r2 dry-run preview regression" "$regression_default" "$(output_value "$path" regression-jql)"
  assert_eq "F3 r2 dry-run stays dry" "true" "$(output_value "$path" dry-run)"
  rm -f "$path" "${path}.err"
fi

# F7 round 2: a channel ID is not a safe non-live override.
expect_failure "F7 r2 foreign channel id" \
  EVENT_NAME=workflow_dispatch \
  INPUT_MODE=release-validation \
  INPUT_DRY_RUN=false \
  INPUT_TEST_CHANNEL='C0C71FCF0J3' \
  GA_MODE=test \
  TEST_CHANNEL_VAR='#qa-test'
path="$(expect_success "setup F7 r2 configured id" \
  EVENT_NAME=schedule \
  SCHEDULE='16 10 * * 1-5' \
  GA_MODE=test \
  TEST_CHANNEL_VAR='C0C71FCF0J3')"
if [[ -n "${path:-}" && -f "$path" ]]; then
  assert_eq "F7 r2 variable id kept" "C0C71FCF0J3" "$(output_value "$path" test-channel)"
  assert_eq "F7 r2 variable id posts" "false" "$(output_value "$path" dry-run)"
  assert_eq "F7 r2 variable id no write" "false" "$(output_value "$path" allow-pr-write)"
  rm -f "$path" "${path}.err"
fi

# F8: a JQL value must not be able to inject later output lines.
injection=$'x\n__RELEASE_SLACK_BLOCKER_JQL__\nallow-pr-write=true\ndry-run=false\ntest-channel=\nmode=release-validation\ninjected<<__RELEASE_SLACK_BLOCKER_JQL__'
expect_failure "F8 jql newline injection" \
  EVENT_NAME=schedule \
  SCHEDULE='16 10 * * 1-5' \
  GA_MODE=test \
  BLOCKER_JQL="$injection" \
  REGRESSION_JQL='type = Bug'

printf '\n%s passed, %s failed\n' "$passed" "$failures"
if [[ "$failures" -ne 0 ]]; then
  exit 1
fi
