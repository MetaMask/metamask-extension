"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchManifestFlagsFromPRAndGit = fetchManifestFlagsFromPRAndGit;
const node_path_1 = __importDefault(require("node:path"));
const promises_1 = __importDefault(require("node:fs/promises"));
const node_util_1 = require("node:util");
const node_child_process_1 = require("node:child_process");
const utils_1 = require("@metamask/utils");
const lodash_1 = require("lodash");
const exec = (0, node_util_1.promisify)(node_child_process_1.exec);
const PR_BODY_FILEPATH = node_path_1.default.resolve(__dirname, '..', '..', 'changed-files', 'pr-body.txt');
/**
 * Search a string for `flags = {...}` and return ManifestFlags if it exists
 *
 * @param str - The string to search
 * @param errorType - The type of error to log if parsing fails
 * @returns The ManifestFlags object if valid, otherwise undefined
 */
function regexSearchForFlags(str, errorType) {
    // Search str for `flags = {...}`
    const flagsMatch = str.match(/flags\s*=\s*(\{.*\})/u);
    if (flagsMatch) {
        try {
            // Get 1st capturing group from regex
            return JSON.parse(flagsMatch[1]);
        }
        catch (error) {
            console.error(`Error parsing flags from ${errorType}, ignoring flags\n`, error);
        }
    }
    return {};
}
/**
 * Get flags from the GitHub PR body if they are set
 *
 * To use this feature, add a line to your PR body like:
 * `flags = {"sentry": {"tracesSampleRate": 0.1}}`
 * (must be valid JSON)
 *
 * @returns Any manifest flags found in the PR body
 */
async function getFlagsFromPrBody() {
    let body;
    try {
        body = await promises_1.default.readFile(PR_BODY_FILEPATH, 'utf8');
    }
    catch (error) {
        if (error instanceof Error &&
            (0, utils_1.hasProperty)(error, 'code') &&
            error.code === 'ENOENT') {
            return {};
        }
        throw error;
    }
    return regexSearchForFlags(body, 'PR body');
}
/**
 * Get flags from the Git message if they are set
 *
 * To use this feature, add a line to your commit message like:
 * `flags = {"sentry": {"tracesSampleRate": 0.1}}`
 * (must be valid JSON)
 *
 * @returns Any manifest flags found in the commit message
 */
async function getFlagsFromGitMessage() {
    const gitMessage = (await exec(`git show --format='%B' --no-patch "HEAD"`))
        .stdout;
    return regexSearchForFlags(gitMessage, 'git message');
}
/**
 * Get any manifest flags found in the PR body and git message.
 *
 * @returns Any manifest flags found
 */
async function fetchManifestFlagsFromPRAndGit() {
    const [prBodyFlags, gitMessageFlags] = await Promise.all([
        getFlagsFromPrBody(),
        getFlagsFromGitMessage(),
    ]);
    return (0, lodash_1.merge)(prBodyFlags, gitMessageFlags);
}
