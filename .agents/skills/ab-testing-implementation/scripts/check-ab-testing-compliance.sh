#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage:
  check-ab-testing-compliance.sh --staged
  check-ab-testing-compliance.sh --files <file1,file2,...> [--base <git-ref>]

Checks changed files for A/B testing implementation compliance.

Rules:
  - Fail: New ab_tests payload additions in checked code diffs
  - Fail: Malformed literal active_ab_tests objects missing key/value
  - Fail: Inline useABTest variants object missing control
  - Warn: Flag key naming mismatch for Abtest keys
  - Warn: Risky A/B integration changes without test-file updates
USAGE
}

MODE=""
FILES_ARG=""
BASE_REF=""
FALLBACK_TO_WORKTREE=0
FALLBACK_NOTE=""

set_mode() {
  local new_mode="$1"
  if [[ -n "$MODE" ]]; then
    echo "ERROR: Choose exactly one mode: --staged or --files."
    usage
    exit 2
  fi
  MODE="$new_mode"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --staged)
      set_mode "staged"
      shift
      ;;
    --files)
      set_mode "files"
      FILES_ARG="${2:-}"
      if [[ -z "$FILES_ARG" ]]; then
        echo "ERROR: --files requires a comma-separated value."
        exit 2
      fi
      shift 2
      ;;
    --base)
      BASE_REF="${2:-}"
      if [[ -z "$BASE_REF" ]]; then
        echo "ERROR: --base requires a git ref (for example origin/main)."
        exit 2
      fi
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "ERROR: Unknown argument: $1"
      usage
      exit 2
      ;;
  esac
done

if [[ -z "$MODE" ]]; then
  echo "ERROR: Choose exactly one mode: --staged or --files."
  usage
  exit 2
fi

resolve_default_base_ref() {
  if [[ "$MODE" != "files" || -n "$BASE_REF" ]]; then
    return
  fi

  local candidate
  for candidate in "origin/main" "main" "HEAD~1"; do
    if git rev-parse --verify "$candidate" >/dev/null 2>&1; then
      BASE_REF="$candidate"
      return
    fi
  done
}

trim() {
  local value="$1"
  value="${value#"${value%%[![:space:]]*}"}"
  value="${value%"${value##*[![:space:]]}"}"
  printf '%s' "$value"
}

is_code_file() {
  local file="$1"
  [[ "$file" =~ \.(ts|tsx|js|jsx)$ ]]
}

is_test_file() {
  local file="$1"
  [[ "$file" =~ \.(test|spec)\.(ts|tsx|js|jsx)$ ]] ||
    [[ "$file" =~ /__tests__/ ]]
}

is_valid_flag_key() {
  local key="$1"
  [[ "$key" =~ ^[a-z][A-Za-z0-9]*[A-Z]{2,}[0-9]+Abtest[A-Z][A-Za-z0-9]*$ ]]
}

collect_staged_files() {
  git diff --cached --name-only --diff-filter=ACMR | awk 'NF && !seen[$0]++'
}

collect_worktree_files() {
  {
    git diff --name-only --diff-filter=ACMR
    git ls-files --others --exclude-standard
  } | awk 'NF && !seen[$0]++'
}

collect_explicit_files() {
  local raw
  local item

  IFS=',' read -r -a raw <<< "$FILES_ARG"
  for item in "${raw[@]}"; do
    item="$(trim "$item")"
    [[ -n "$item" ]] && printf '%s\n' "$item"
  done | awk 'NF && !seen[$0]++'
}

extract_added_lines_from_diff() {
  awk '
    /^\+\+\+ / { next }
    /^\+/ { sub(/^\+/, ""); print }
  ' || true
}

get_added_lines() {
  local file="$1"
  local base_ref="${2:-}"

  if [[ "$MODE" == "staged" ]]; then
    if [[ "$FALLBACK_TO_WORKTREE" -eq 1 ]]; then
      if [[ -f "$file" ]] && ! git ls-files --error-unmatch "$file" >/dev/null 2>&1; then
        cat "$file"
        return
      fi

      git diff --unified=0 -- "$file" | extract_added_lines_from_diff
      return
    fi

    git diff --cached --unified=0 -- "$file" | extract_added_lines_from_diff
    return
  fi

  if [[ -f "$file" ]] && ! git cat-file -e "HEAD:$file" >/dev/null 2>&1; then
    cat "$file"
    return
  fi

  if [[ -n "$base_ref" ]] && git rev-parse --verify "$base_ref" >/dev/null 2>&1; then
    git diff --unified=0 "$base_ref"...HEAD -- "$file" | extract_added_lines_from_diff
    return
  fi

  if git ls-files --error-unmatch "$file" >/dev/null 2>&1; then
    git diff --unified=0 HEAD -- "$file" | extract_added_lines_from_diff
  fi
}

FAILURES=()
WARNINGS=()
AB_RISKY_CHANGE_FILES=()
TEST_CHANGED=0

CHANGED_FILES=()
if [[ "$MODE" == "staged" ]]; then
  while IFS= read -r file; do
    [[ -n "$file" ]] && CHANGED_FILES+=("$file")
  done < <(collect_staged_files)

  if [[ ${#CHANGED_FILES[@]} -eq 0 ]]; then
    FALLBACK_TO_WORKTREE=1
    FALLBACK_NOTE="Info: no staged files found; falling back to working-tree changed files."
    while IFS= read -r file; do
      [[ -n "$file" ]] && CHANGED_FILES+=("$file")
    done < <(collect_worktree_files)
  fi
else
  while IFS= read -r file; do
    [[ -n "$file" ]] && CHANGED_FILES+=("$file")
  done < <(collect_explicit_files)
fi

resolve_default_base_ref

if [[ ${#CHANGED_FILES[@]} -eq 0 || ( ${#CHANGED_FILES[@]} -eq 1 && -z "${CHANGED_FILES[0]}" ) ]]; then
  if [[ "$MODE" == "staged" ]]; then
    echo "A/B compliance check: no staged files and no working-tree changed files to inspect."
  else
    echo "A/B compliance check: no files to inspect from --files input."
  fi
  exit 0
fi

for file in "${CHANGED_FILES[@]}"; do
  [[ -z "$file" ]] && continue

  if is_test_file "$file"; then
    TEST_CHANGED=1
    continue
  fi

  if ! is_code_file "$file"; then
    continue
  fi

  added="$(get_added_lines "$file" "$BASE_REF")"
  [[ -z "$added" ]] && continue

  if grep -Eq 'useABTest\(|active_ab_tests[[:space:]]*:|ab_tests[[:space:]]*:|trackEvent\(|createEventBuilder\(|MetaMetricsEvents\.|Experiment Viewed|ExperimentViewed' <<< "$added"; then
    AB_RISKY_CHANGE_FILES+=("$file")
  fi

  while IFS= read -r line; do
    if [[ "$line" =~ active_ab_tests[[:space:]]*: ]]; then
      continue
    fi
    if [[ "$line" =~ (^|[^A-Za-z0-9_])ab_tests[[:space:]]*: ]] && [[ ! "$line" =~ LEGACY_AB_TEST_ALLOWED ]]; then
      FAILURES+=("$file: added 'ab_tests' payload. New ab_tests payloads are forbidden.")
    fi
  done <<< "$added"

  added_lines=()
  while IFS= read -r added_line; do
    added_lines+=("$added_line")
  done <<< "$added"
  line_count="${#added_lines[@]}"

  for ((i=0; i<line_count; i++)); do
    line="${added_lines[$i]}"

    if [[ "$line" =~ active_ab_tests[[:space:]]*: ]]; then
      if [[ "$line" =~ active_ab_tests[[:space:]]*:[[:space:]]*(\[|\{) ]]; then
        window="$line"
        for ((j=i+1; j<line_count && j<=i+8; j++)); do
          window+=$'\n'"${added_lines[$j]}"
        done
        if ! grep -Eq 'key[[:space:]]*:' <<< "$window" || ! grep -Eq 'value[[:space:]]*:' <<< "$window"; then
          FAILURES+=("$file: malformed literal active_ab_tests object (expected key and value).")
        fi
      fi
    fi

    if [[ "$line" =~ useABTest[[:space:]]*\( ]]; then
      call_window=""
      paren_depth=0
      for ((j=i; j<line_count; j++)); do
        segment="${added_lines[$j]}"
        if (( j == i )); then
          segment="useABTest${segment#*useABTest}"
        fi

        call_window+="${call_window:+$'\n'}${segment}"

        open_count="$(printf '%s' "$segment" | tr -cd '(' | wc -c | tr -d ' ')"
        close_count="$(printf '%s' "$segment" | tr -cd ')' | wc -c | tr -d ' ')"
        paren_depth=$((paren_depth + open_count - close_count))

        if (( paren_depth <= 0 )); then
          break
        fi
      done

      normalized_call="$(printf '%s' "$call_window" | tr '\n' ' ')"
      if grep -Eq 'useABTest[[:space:]]*\([^,]+,[[:space:]]*\{' <<< "$normalized_call"; then
        if ! grep -Eq 'control[[:space:]]*:' <<< "$call_window"; then
          FAILURES+=("$file: inline useABTest variants object is missing control.")
        fi
      fi
    fi

    use_abtest_literal_key="$(sed -nE "s/.*useABTest[[:space:]]*\\([[:space:]]*['\"]([^'\"]+)['\"].*/\\1/p" <<< "$line")"
    if [[ -n "$use_abtest_literal_key" ]]; then
      if ! is_valid_flag_key "$use_abtest_literal_key"; then
        WARNINGS+=("$file: flag key '$use_abtest_literal_key' does not match {team}{TICKET}Abtest{Name}.")
      fi
    fi

    while IFS= read -r quoted; do
      [[ -z "$quoted" ]] && continue
      key="${quoted:1:${#quoted}-2}"
      if [[ -n "$use_abtest_literal_key" && "$key" == "$use_abtest_literal_key" ]]; then
        continue
      fi
      if ! is_valid_flag_key "$key"; then
        WARNINGS+=("$file: Abtest key '$key' does not match {team}{TICKET}Abtest{Name}.")
      fi
    done < <(grep -oE "['\"][^'\"]*Abtest[^'\"]*['\"]" <<< "$line" || true)
  done
done

if [[ ${#AB_RISKY_CHANGE_FILES[@]} -gt 0 && "$TEST_CHANGED" -eq 0 ]]; then
  WARNINGS+=("Risky A/B integration changes were detected without any test-file updates. For copy/config-only changes, document rationale in your response.")
fi

echo "A/B compliance check summary"
echo "Mode: $MODE"
if [[ -n "$FALLBACK_NOTE" ]]; then
  echo "$FALLBACK_NOTE"
fi
if [[ "$MODE" == "files" && -n "$BASE_REF" ]]; then
  echo "Base ref: $BASE_REF"
fi
echo "Files inspected: ${#CHANGED_FILES[@]}"

if [[ ${#FAILURES[@]} -gt 0 ]]; then
  echo ""
  echo "Failures:"
  printf '%s\n' "${FAILURES[@]}" | awk '!seen[$0]++' | sed 's/^/- /'
fi

if [[ ${#WARNINGS[@]} -gt 0 ]]; then
  echo ""
  echo "Warnings:"
  printf '%s\n' "${WARNINGS[@]}" | awk '!seen[$0]++' | sed 's/^/- /'
fi

if [[ ${#FAILURES[@]} -gt 0 ]]; then
  exit 1
fi

exit 0
