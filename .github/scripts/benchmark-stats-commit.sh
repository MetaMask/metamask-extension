#!/usr/bin/env bash
#
# Pushes benchmark results to MetaMask/extension_benchmark_stats.
# Writes stats/{branch}/performance_data.json, keyed by commit hash.
#
# Mode (BENCHMARK_DATA_TYPE):
#   performance (default) - aggregates benchmark-*.json artifacts (startup, interaction,
#                           user journey, dapp page load / pageLoadBenchmark) into performance_data.json
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

DATA_TYPE="${BENCHMARK_DATA_TYPE:-performance}"
CLONE_DIR="temp-benchmark-stats"

# Sanitize branch name for use as a directory (e.g. release/12.x → release-12.x)
RAW_BRANCH="${BRANCH_NAME:-main}"
SAFE_BRANCH="${RAW_BRANCH//\//-}"

# Assemble the commit data based on mode
assemble_performance_data() {
    local results_dir="${BENCHMARK_RESULTS_DIR:-benchmark-results}"

    if [[ ! -d "${results_dir}" ]]; then
        echo "Benchmark results directory not found: ${results_dir}" >&2
        exit 1
    fi

    # Startup benchmarks run on chrome/firefox × webpack (test build).
    # They are merged under the historical preset key "pageLoad" (legacy name in performance_data.json),
    # with entries keyed as "{browser}-{buildType}-{presetName}"
    # (e.g. "chrome-webpack-startupStandardHome").
    #
    # Interaction, user journey, and dapp page load presets only run on chrome-webpack (CI test build)
    # and are stored under their own preset key (e.g. "interactionUserActions",
    # "userJourneyAssets", "pageLoadBenchmark").
    local STARTUP_PRESETS=("startupStandardHome" "startupPowerUserHome")

    local presets_json="{}"
    local page_load_json="{}"
    local file_count=0

    for file in "${results_dir}"/benchmark-*.json; do
        if [[ ! -f "${file}" ]]; then
            continue
        fi

        if ! jq . "${file}" > /dev/null 2>&1; then
            echo "Warning: Skipping invalid JSON file: ${file}" >&2
            continue
        fi

        # Filename format: benchmark-{browser}-{buildType}-{preset}.json
        # browser:   chrome | firefox
        # buildType: webpack (CI benchmark artifacts)
        local base_name browser build_type preset_name
        base_name=$(basename "${file}" .json | sed 's/^benchmark-//')
        browser=$(echo "${base_name}" | cut -d'-' -f1)
        build_type=$(echo "${base_name}" | cut -d'-' -f2)
        preset_name=$(echo "${base_name}" | cut -d'-' -f3-)

        local is_startup=false
        for startup_preset in "${STARTUP_PRESETS[@]}"; do
            if [[ "${preset_name}" == "${startup_preset}" ]]; then
                is_startup=true
                break
            fi
        done

        if [[ "${is_startup}" == true ]]; then
            # Store all browser/buildType combinations for startup presets.
            # Unwrap the outer key: the benchmark runner wraps results as { "<camelCaseFileName>": {...} }.
            # The inner key is the camelCase filename (e.g. "standardHome"), NOT the preset name
            # (e.g. "startupStandardHome"), so we unwrap by checking for a single-key object.
            local preset_data startup_key
            preset_data=$(jq 'if (keys | length) == 1 then .[keys[0]] else . end' "${file}")
            startup_key="${browser}-${build_type}-${preset_name}"
            echo "  Adding startup preset '${startup_key}'" >&2
            page_load_json=$(echo "${page_load_json}" | jq \
                --arg key "${startup_key}" \
                --argjson data "${preset_data}" \
                '. + {($key): $data}')
        elif [[ "${browser}" == "chrome" && "${build_type}" == "webpack" ]]; then
            # For interaction, user journey, and dapp page load presets, only store chrome-webpack —
            # that is what the PR comment displays.
            local preset_data
            preset_data=$(jq . "${file}")
            echo "  Adding preset '${preset_name}' (chrome-webpack)" >&2
            presets_json=$(echo "${presets_json}" | jq \
                --arg key "${preset_name}" \
                --argjson data "${preset_data}" \
                '. + {($key): $data}')
        else
            echo "  Skipping ${browser}-${build_type}-${preset_name} (non-startup, non-canonical)" >&2
            continue
        fi

        file_count=$((file_count + 1))
    done

    if [[ ${file_count} -eq 0 ]]; then
        echo "No benchmark files found in ${results_dir}, skipping." >&2
        return
    fi

    # Merge the startup group into presets (only if any startup files were found).
    if [[ "${page_load_json}" != "{}" ]]; then
        presets_json=$(echo "${presets_json}" | jq --argjson pl "${page_load_json}" '. + {"pageLoad": $pl}')
    fi

    echo "Collected ${file_count} preset(s)" >&2

    jq -n \
        --argjson timestamp "$(date +%s000)" \
        --argjson presets "${presets_json}" \
        '{ timestamp: $timestamp, presets: $presets }'
}

# Resolve stats file and assemble data
case "${DATA_TYPE}" in
    performance)
        STATS_FILE="stats/${SAFE_BRANCH}/performance_data.json"
        COMMIT_MESSAGE="Adding performance benchmark data for ${RAW_BRANCH} at commit: ${HEAD_COMMIT_HASH}"
        echo "Mode: performance (branch: ${RAW_BRANCH})"
        echo "Assembling benchmark data from directory..."
        COMMIT_DATA=$(assemble_performance_data)
        if [[ -z "${COMMIT_DATA}" ]]; then
            echo "No benchmark data assembled, skipping."
            exit 0
        fi
        ;;
    *)
        echo "Unknown BENCHMARK_DATA_TYPE: ${DATA_TYPE}"
        echo "Must be 'performance'"
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
