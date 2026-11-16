#!/usr/bin/env bash
# Runs inside Claude Code's sandboxed Bash tool. It writes its own results
# file, so a later unsandboxed step can assert on them without trusting the model.
cd "$(git rev-parse --show-toplevel)" || exit 1
: > sandbox-results.txt
: > sandbox-detail.txt

record() {
  local name=$1 code=$2 out=$3
  if [ "$code" -eq 0 ]; then
    echo "PASS $name" >> sandbox-results.txt
  else
    echo "FAIL $name (exit $code)" >> sandbox-results.txt
    { echo "--- $name"; printf '%s\n' "$out" | head -n 6 | cut -c1-300; echo '...'; printf '%s\n' "$out" | tail -n 6 | cut -c1-300; echo 'errors:'; printf '%s\n' "$out" | grep -vE '^\s+at ' | grep -E 'YN0001|YN0035|YN0013|Error|ERR' | cut -c1-250 | sort | uniq -c | head -n 8; echo 'yarn error context:'; printf '%s\n' "$out" | grep -B3 -A1 'YN0001' | cut -c1-250 | head -n 24; echo 'hosts mentioned:'; printf '%s\n' "$out" | grep -oE 'https?://[^/ "]+' | sort | uniq -c | head -n 8; } >> sandbox-detail.txt
  fi
}

check() {
  local name=$1 out code
  shift
  out=$("$@" 2>&1)
  code=$?
  record "$name" "$code" "$out"
}

check_fails() {
  local name=$1 out code
  shift
  out=$("$@" 2>&1)
  code=$?
  if [ "$code" -ne 0 ]; then record "$name" 0 ""; else record "$name" 1 "unexpectedly succeeded: $out"; fi
}

restore() { git checkout -q -- package.json yarn.lock; git clean -fdq .yarn/patches; }

# Yarn ignores the standard proxy variables, so hand it the sandbox's proxy.
export YARN_HTTP_PROXY="${HTTP_PROXY:-${http_proxy:-}}"
export YARN_HTTPS_PROXY="${HTTPS_PROXY:-${https_proxy:-}}"
{ echo '--- env'; env | grep -ciE 'proxy' ; echo "HOME=$HOME uid=$(id -u)"; ls -ld "$HOME"; } >> sandbox-detail.txt

{
  echo '--- write locations (PASS means the write succeeded)'
  for p in "$HOME/w-probe" "$HOME/.ssh-w-probe" /tmp/w-probe /etc/w-probe /usr/w-probe ./w-probe; do
    if touch "$p" 2> /dev/null; then echo "writable: $p"; rm -f "$p"; else echo "denied:   $p"; fi
  done
  echo '--- sandbox parent'
  tr '\0' ' ' < "/proc/$PPID/cmdline" 2> /dev/null | cut -c1-1500; echo
  grep -E 'NoNewPrivs|Seccomp' /proc/self/status
  echo '--- mounts under the repo'
  grep -E 'node_modules|/\.git| \.bin' /proc/self/mountinfo | cut -c1-220 | head -n 12
} >> sandbox-detail.txt

# Isolation
check_fails 'credential is hidden from the shell' bash -c '[ -n "${ANTHROPIC_AUTH_TOKEN:-}" ]'
check_fails 'GITHUB_ENV is not writable' bash -c 'printf "" >> "$GITHUB_ENV"'
check_fails 'GITHUB_PATH is not writable' bash -c 'printf "" >> "$GITHUB_PATH"'
check_fails 'RUNNER_TEMP is not writable' touch "$RUNNER_TEMP/sandbox-probe"
check_fails 'home .ssh is not writable' bash -c 'mkdir -p "$HOME/.ssh" 2>/dev/null; touch "$HOME/.ssh/sandbox-probe"'
check_fails 'no direct network route' curl --noproxy '*' -sS --max-time 10 https://example.com
check_fails 'host outside the allowlist is refused' curl -sS --max-time 15 -o /dev/null https://example.com
check 'allowed registry host is reachable' curl -sS --max-time 20 -o /dev/null --fail https://registry.npmjs.org/react

# Yarn, lockfile only
check 'yarn version matches packageManager' bash -c 'test "$(yarn --version)" = "$(node -p "require(\"./package.json\").packageManager.split(\"@\")[1].split(\"+\")[0]")"'
check 'yarn why' bash -c 'yarn why minimatch | head -n 3 | grep -q .'

# Yarn, network
check 'yarn npm info' bash -c 'yarn npm info react --fields version --json | grep -q version'
check 'yarn npm audit reaches the registry' bash -c '
  yarn npm audit --recursive --environment production --json > audit.json 2> audit.err
  ! grep -qiE "ENOTFOUND|ECONN|EAI_AGAIN|403|blocked|refused|YN0035" audit.json audit.err'
# node_modules comes from a trusted pre-agent install.
check 'node_modules is writable' bash -c 'touch node_modules/sandbox-probe && rm node_modules/sandbox-probe'
check 'yarn install --mode=update-lockfile' yarn install --mode=update-lockfile
restore
check 'yarn dedupe --check' yarn dedupe --check

# Yarn patch round trip
check 'yarn patch and patch-commit' bash -c '
  target=$(node -e "const l=require(\"fs\").readFileSync(\"yarn.lock\",\"utf8\");const m=l.match(/^\"?ms@npm:[^\n]*:\n\s+version: (\S+)/m);console.log(m?\"ms@npm:\"+m[1]:\"\")")
  test -n "$target" || { echo "no ms in lockfile"; exit 1; }
  pout=$(yarn patch "$target" 2>&1); echo "$pout" | head -n 8
  dir=$(echo "$pout" | grep -oE "/tmp/[^ ]+/user" | head -n 1)
  echo "dir=[$dir]"; ls -ld "$dir" 2>&1
  test -d "$dir" || { echo "no patch dir"; exit 1; }
  echo "// probe" >> "$dir/index.js"
  yarn patch-commit -s "$dir"
  new=$(git ls-files --others --exclude-standard .yarn/patches)
  test -n "$new" && test -s "$new"'
restore

# Tools that need node_modules
check 'yarn allow-scripts auto' yarn allow-scripts auto
restore
check 'jest runs one test' node --expose-gc ./node_modules/jest/bin/jest.js --no-watchman shared/lib/deep-links/utils.test.ts

git status --short | head -n 10 >> sandbox-detail.txt
echo "DONE" >> sandbox-results.txt
