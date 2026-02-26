#!/usr/bin/env bash
#
# Pushes benchmark results to MetaMask/extension_benchmark_stats.
# Called twice per CI run (once per mode), writing to separate stats files
# under stats/{branch}/, both keyed by commit hash.
#
# Modes (BENCHMARK_DATA_TYPE):
#   dapp-page-load (default) - appends a single dapp page-load JSON to dapp_page_load_data.json
#   performance              - aggregates Selenium-based benchmark JSONs (startup, interaction,
#                              user-journey) into performance_data.json
#

set -e
set -u
set -o pipefail

if [[ -z "${EXTENSION_BENCHMARK_STATS_TOKEN:-}" ]]; then
    printf '%s\n' 'EXTENSION_BENCHMARK_STATS_TOKEN environment variable must be set'
    exit 1
fi

if [[ -z "${HEAD_COMMIT_HASH:-}" ]]; then
    printf '%s\n' 'HEAD_COMMIT_HASH environment variable must be set'
    exit 1
fi

if [[ -z "${OWNER:-}" ]]; then
    printf '%s\n' 'OWNER environment variable must be set'
    exit 1
fi

DATA_TYPE="${BENCHMARK_DATA_TYPE:-dapp-page-load}"
CLONE_DIR="temp-benchmark-stats"

# Sanitize branch name for use as a directory (e.g. release/12.x → release-12.x)
RAW_BRANCH="${BRANCH_NAME:-main}"
SAFE_BRANCH=$(echo "${RAW_BRANCH}" | sed 's|/|-|g')

# Assemble the commit data based on mode
assemble_dapp_page_load_data() {
    local benchmark_file="${BENCHMARK_FILE:-../test-artifacts/benchmarks/dapp-page-load-benchmark-results.json}"

    jq . "${benchmark_file}" > /dev/null || {
        echo "Error: Benchmark JSON is invalid: ${benchmark_file}"
        exit 1
    }

    cat "${benchmark_file}"
}

assemble_performance_data() {
    local results_dir="${BENCHMARK_RESULTS_DIR:-benchmark-results}"

    if [[ ! -d "${results_dir}" ]]; then
        echo "Benchmark results directory not found: ${results_dir}"
        exit 1
    fi

    # Page load presets run on ALL browser/buildType combinations (chrome/firefox × browserify/webpack).
    # They are stored under the "pageLoad" group, keyed as "{browser}-{buildType}-{preset}"
    # so each combination has its own historical entry (e.g. "chrome-browserify-standardHome").
    #
    # User action and performance presets only run on chrome-browserify (the canonical production
    # target) and are stored under their own preset key (e.g. "userActions", "performanceAssets").
    local PAGE_LOAD_PRESETS=("standardHome" "powerUserHome")

    local presets_json="{}"
    local page_load_json="{}"
    local file_count=0

    for file in "${results_dir}"/benchmark-*.json; do
        if [[ ! -f "${file}" ]]; then
            continue
        fi

        if ! jq . "${file}" > /dev/null 2>&1; then
            echo "Warning: Skipping invalid JSON file: ${file}"
            continue
        fi

        # Filename format: benchmark-{browser}-{buildType}-{preset}.json
        # browser:   chrome | firefox
        # buildType: browserify | webpack
        local base_name browser build_type preset_name
        base_name=$(basename "${file}" .json | sed 's/^benchmark-//')
        browser=$(echo "${base_name}" | cut -d'-' -f1)
        build_type=$(echo "${base_name}" | cut -d'-' -f2)
        preset_name=$(echo "${base_name}" | cut -d'-' -f3-)

        local is_page_load=false
        for pl_preset in "${PAGE_LOAD_PRESETS[@]}"; do
            if [[ "${preset_name}" == "${pl_preset}" ]]; then
                is_page_load=true
                break
            fi
        done

        if [[ "${is_page_load}" == true ]]; then
            # Store all browser/buildType combinations for page load presets.
            # Unwrap the outer key (benchmark JSON wraps result in { "<presetName>": {...} }).
            local preset_data page_load_key
            preset_data=$(jq --arg key "${preset_name}" \
                'if (keys | length) == 1 and has($key) then .[$key] else . end' "${file}")
            page_load_key="${browser}-${build_type}-${preset_name}"
            echo "  Adding page load preset '${page_load_key}'"
            page_load_json=$(echo "${page_load_json}" | jq \
                --arg key "${page_load_key}" \
                --argjson data "${preset_data}" \
                '. + {($key): $data}')
        elif [[ "${browser}" == "chrome" && "${build_type}" == "browserify" ]]; then
            # For user action and performance presets, only store chrome-browserify —
            # that is what the PR comment displays.
            local preset_data
            preset_data=$(jq . "${file}")
            echo "  Adding preset '${preset_name}' (chrome-browserify)"
            presets_json=$(echo "${presets_json}" | jq \
                --arg key "${preset_name}" \
                --argjson data "${preset_data}" \
                '. + {($key): $data}')
        else
            echo "  Skipping ${browser}-${build_type}-${preset_name} (non-page-load, non-canonical)"
            continue
        fi

        file_count=$((file_count + 1))
    done

    if [[ ${file_count} -eq 0 ]]; then
        echo "No benchmark files found in ${results_dir}, skipping."
        exit 0
    fi

    # Merge the pageLoad group into presets (only if any page load files were found)
    if [[ "${page_load_json}" != "{}" ]]; then
        presets_json=$(echo "${presets_json}" | jq --argjson pl "${page_load_json}" '. + {"pageLoad": $pl}')
    fi

    echo "Collected ${file_count} preset(s)"

    jq -n \
        --argjson timestamp "$(date +%s000)" \
        --argjson presets "${presets_json}" \
        '{ timestamp: $timestamp, presets: $presets }'
}

# Resolve stats file and assemble data
case "${DATA_TYPE}" in
    dapp-page-load)
        STATS_FILE="stats/${SAFE_BRANCH}/dapp_page_load_data.json"
        COMMIT_MESSAGE="Adding dapp page-load benchmark data for ${RAW_BRANCH} at commit: ${HEAD_COMMIT_HASH}"
        echo "Mode: dapp-page-load (branch: ${RAW_BRANCH})"
        # Assemble after cloning since the benchmark file path is relative
        ;;
    performance)
        STATS_FILE="stats/${SAFE_BRANCH}/performance_data.json"
        COMMIT_MESSAGE="Adding performance benchmark data for ${RAW_BRANCH} at commit: ${HEAD_COMMIT_HASH}"
        echo "Mode: performance (branch: ${RAW_BRANCH})"
        echo "Assembling benchmark data from directory..."
        COMMIT_DATA=$(assemble_performance_data)
        ;;
    *)
        echo "Unknown BENCHMARK_DATA_TYPE: ${DATA_TYPE}"
        echo "Must be 'dapp-page-load' or 'performance'"
        exit 1
        ;;
esac

# --- Clone the stats repo ---

rm -rf "${CLONE_DIR}"
mkdir -p "${CLONE_DIR}"

git config --global user.email "metamaskbot@users.noreply.github.com"
git config --global user.name "MetaMask Bot"

git clone --depth 1 https://github.com/MetaMask/extension_benchmark_stats.git "${CLONE_DIR}"
cd "${CLONE_DIR}"
git fetch origin main:main
git checkout main

# For dapp-page-load mode, assemble after cd so relative paths work
if [[ "${DATA_TYPE}" == "dapp-page-load" ]]; then
    COMMIT_DATA=$(assemble_dapp_page_load_data)
fi

# --- Ensure the stats file exists ---

mkdir -p "$(dirname "${STATS_FILE}")"
if [[ ! -f "${STATS_FILE}" ]]; then
    echo "{}" > "${STATS_FILE}"
fi

jq . "${STATS_FILE}" > /dev/null || {
    echo "Error: Existing stats JSON is invalid: ${STATS_FILE}"
    exit 1
}

# --- Check for duplicate ---

if jq -e "has(\"${HEAD_COMMIT_HASH}\")" "${STATS_FILE}" > /dev/null; then
    echo "SHA ${HEAD_COMMIT_HASH} already exists in ${STATS_FILE}. No new commit needed."
    cd ..
    rm -rf "${CLONE_DIR}"
    exit 0
fi

# --- Append and push ---

TEMP_FILE="${STATS_FILE}.tmp"

jq --arg sha "${HEAD_COMMIT_HASH}" --argjson data "${COMMIT_DATA}" \
    '. + {($sha): $data}' "${STATS_FILE}" > "${TEMP_FILE}"
mv "${TEMP_FILE}" "${STATS_FILE}"

git add "${STATS_FILE}"
git commit --message "${COMMIT_MESSAGE}"

repo_slug="${OWNER}/extension_benchmark_stats"
git push "https://metamaskbot:${EXTENSION_BENCHMARK_STATS_TOKEN}@github.com/${repo_slug}" main

cd ..
rm -rf "${CLONE_DIR}"

echo "Successfully committed ${DATA_TYPE} benchmark data for ${HEAD_COMMIT_HASH}"
