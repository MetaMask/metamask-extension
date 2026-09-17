#!/usr/bin/env bash
# Run firefox-bundle-script prepare_release.sh once and emit the local
# runtime contenthash for AMO reproducibility experiments.
#
# Usage:
#   test-amo-prepare-release-repro.sh <main|flask> <stock|bump>
#
# Environment:
#   FIREFOX_BUNDLE_SCRIPT_TOKEN  — clone private firefox-bundle-script
#   GITHUB_OUTPUT                — optional Actions output file
#   AGENT_VERSION                — extension version (default: 13.47.1)
#   AGENT_LAST_LISTED            — last listed AMO version (default: 13.46.1)
#   AGENT_SWC_BUMP_REF           — git ref used for bump inject
#                                  (default: bump/swc-core-amo-determinism)
#
# source=stock  → tagged archive as published (@swc/core 1.13.3 on v13.47.1)
# source=bump   → same prepare_release path, but inject SWC 1.16.2 + loader
#                 fixes from AGENT_SWC_BUMP_REF into the extracted source

set -euo pipefail

FIREFOX_BUNDLE_SCRIPT_REF="1cb37c0817b319d9846dbca827d533e0ae769984"
VARIANT="${1:-}"
SOURCE_MODE="${2:-}"
VERSION="${AGENT_VERSION:-13.47.1}"
LAST_LISTED="${AGENT_LAST_LISTED:-13.46.1}"
SWC_BUMP_REF="${AGENT_SWC_BUMP_REF:-bump/swc-core-amo-determinism}"
FIREFOX_BUNDLE_SH_GIT_REF="${FIREFOX_BUNDLE_SH_GIT_REF:-v${VERSION}}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INJECT_PY="${SCRIPT_DIR}/inject-amo-swc-bump.py"

if [[ "${VARIANT}" != "main" && "${VARIANT}" != "flask" ]]; then
  echo "::error::Usage: $0 [main|flask] [stock|bump]"
  exit 1
fi
if [[ "${SOURCE_MODE}" != "stock" && "${SOURCE_MODE}" != "bump" ]]; then
  echo "::error::Usage: $0 [main|flask] [stock|bump]"
  exit 1
fi
if [[ -z "${FIREFOX_BUNDLE_SCRIPT_TOKEN:-}" ]]; then
  echo "::error::FIREFOX_BUNDLE_SCRIPT_TOKEN is required"
  exit 1
fi

ensure_mtree() {
  if command -v mtree >/dev/null 2>&1; then
    return
  fi
  echo "Installing mtree-netbsd..."
  sudo apt-get update -qq
  sudo apt-get install -y mtree-netbsd
  command -v mtree >/dev/null 2>&1 || {
    echo "::error::mtree still unavailable after installing mtree-netbsd"
    exit 1
  }
}

clone_firefox_bundle_script() {
  local script_ref="$1"
  local clone_dir="$2"
  local repo_url="https://${FIREFOX_BUNDLE_SCRIPT_TOKEN}@github.com/MetaMask/firefox-bundle-script.git"

  rm -rf "${clone_dir}"
  mkdir -p "$(dirname "${clone_dir}")"
  git init "${clone_dir}"
  git -C "${clone_dir}" remote add origin "${repo_url}"
  git -C "${clone_dir}" fetch --depth 1 origin "${script_ref}"
  git -C "${clone_dir}" checkout FETCH_HEAD
}

prepare_bump_patches() {
  local patch_root="$1"
  mkdir -p "${patch_root}/development/webpack/utils/loaders"

  echo "Fetching SWC bump files from ${SWC_BUMP_REF}..."
  git fetch --depth 1 origin "${SWC_BUMP_REF}"
  git show "FETCH_HEAD:development/webpack/webpack.config.ts" \
    > "${patch_root}/development/webpack/webpack.config.ts"
  git show "FETCH_HEAD:development/webpack/utils/loaders/envValidationLoader.ts" \
    > "${patch_root}/development/webpack/utils/loaders/envValidationLoader.ts"

  cp "${INJECT_PY}" "${patch_root}/inject-amo-swc-bump.py"
}

patch_compare_builds_for_swc_bump() {
  local clone_dir="$1"
  local patch_root="$2"
  local path="${clone_dir}/scripts/compare_builds.sh"

  if grep -q 'AGENT: inject @swc/core@1.16.2' "${path}"; then
    return
  fi

  python3 - "${path}" "${patch_root}" <<'PY'
from pathlib import Path
import sys

path = Path(sys.argv[1])
patch_root = Path(sys.argv[2]).resolve()
text = path.read_text(encoding="utf-8")
needle = 'log_success "Bundle script copied to ${SOURCE_DIR}"\n'
if needle not in text:
    raise SystemExit("compare_builds.sh inject point not found")

inject = f'''log_success "Bundle script copied to ${{SOURCE_DIR}}"
# AGENT: inject @swc/core@1.16.2 + ts/tsx loader fixes from bump branch files
if [ "${{AGENT_APPLY_SWC_BUMP:-}}" = "1" ]; then
  python3 "{patch_root}/inject-amo-swc-bump.py" "${{SOURCE_DIR}}" "{patch_root}"
fi
'''
path.write_text(text.replace(needle, inject, 1), encoding="utf-8")
print("compare_builds.sh patched for SWC bump inject", flush=True)
PY
}

emit_result() {
  local runtime_file="$1"
  local prepare_rc="$2"
  local runtime_name="" runtime_hash="" runtime_sha=""
  if [[ -n "${runtime_file}" && -f "${runtime_file}" ]]; then
    runtime_name="$(basename "${runtime_file}")"
    runtime_hash="$(echo "${runtime_name}" | cut -d. -f2)"
    runtime_sha="$(sha256sum "${runtime_file}" | awk '{print $1}')"
  fi

  echo "variant=${VARIANT}"
  echo "source_mode=${SOURCE_MODE}"
  echo "prepare_rc=${prepare_rc}"
  echo "runtime_file=${runtime_name}"
  echo "runtime_hash=${runtime_hash}"
  echo "runtime_sha256=${runtime_sha}"

  if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
    {
      echo "variant=${VARIANT}"
      echo "source_mode=${SOURCE_MODE}"
      echo "prepare_rc=${prepare_rc}"
      echo "runtime_file=${runtime_name}"
      echo "runtime_hash=${runtime_hash}"
      echo "runtime_sha256=${runtime_sha}"
    } >> "${GITHUB_OUTPUT}"
  fi

  mkdir -p results
  python3 - <<PY
import json
from pathlib import Path
row = {
  "variant": "${VARIANT}",
  "sourceMode": "${SOURCE_MODE}",
  "prepareRc": int("${prepare_rc}"),
  "runtimeFile": """${runtime_name}""",
  "runtimeHash": """${runtime_hash}""",
  "runtimeSha256": """${runtime_sha}""",
  "version": "${VERSION}",
  "swcBumpRef": "${SWC_BUMP_REF}" if "${SOURCE_MODE}" == "bump" else "",
}
Path("results/result.json").write_text(json.dumps(row) + "\n", encoding="utf-8")
print(json.dumps(row), flush=True)
PY
}

ensure_mtree

WORK_ROOT="/tmp/amo-prepare-release-repro"
CLONE_DIR="${WORK_ROOT}/firefox-bundle-script"
PATCH_ROOT="${WORK_ROOT}/patches"

echo "Cloning firefox-bundle-script at ${FIREFOX_BUNDLE_SCRIPT_REF}..."
clone_firefox_bundle_script "${FIREFOX_BUNDLE_SCRIPT_REF}" "${CLONE_DIR}"

export FIREFOX_BUNDLE_SH_GIT_REF
export AGENT_APPLY_SWC_BUMP=0
if [[ "${SOURCE_MODE}" == "bump" ]]; then
  export AGENT_APPLY_SWC_BUMP=1
  prepare_bump_patches "${PATCH_ROOT}"
  patch_compare_builds_for_swc_bump "${CLONE_DIR}" "${PATCH_ROOT}"
fi

PREPARE_ARGS=("${VERSION}" "${LAST_LISTED}")
if [[ "${VARIANT}" == "flask" ]]; then
  PREPARE_ARGS=(--flask "${VERSION}" "${LAST_LISTED}")
fi

set +e
(
  cd "${CLONE_DIR}"
  bash ./prepare_release.sh "${PREPARE_ARGS[@]}"
)
PREPARE_RC=$?
set -e

if [[ "${VARIANT}" == "flask" ]]; then
  CMP_DIR="${CLONE_DIR}/output/flask_comparison_v${VERSION}/comparison"
else
  CMP_DIR="${CLONE_DIR}/output/comparison_v${VERSION}/comparison"
fi

LOCAL_RUNTIME=""
if [[ -d "${CMP_DIR}/local_build" ]]; then
  LOCAL_RUNTIME="$(find "${CMP_DIR}/local_build" -name 'runtime.*.js' | head -n 1 || true)"
fi

emit_result "${LOCAL_RUNTIME}" "${PREPARE_RC}"

# Always succeed the step so the matrix can aggregate hashes.
# Non-determinism / mismatch is reported by the summarize job.
exit 0
