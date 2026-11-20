/**
 * Plan a GitHub suggestion review for an E2E API mock drift diff.
 *
 * Suggestions can only be attached to lines that are already in the pull
 * request diff, and only a complete drift is suggested. Anything else is a
 * fallback: the workflow comments the diff and the local sync command.
 */

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const MAX_COMMENTS = 30;
const MAX_SUGGESTION_CHARS = 60000;
const MAX_TOTAL_CHARS = 200000;
// Merge hunks separated by at most this many unchanged lines when they sit
// in the same pull request hunk. Far-apart edits stay separate.
const COALESCE_GAP = 2;

const REVIEW_MARKER = '<!-- e2e-api-mock-sync-review -->';
const HUNK_HEADER = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/u;

class Fallback extends Error {}

type Hunk = [number, number, string[]];

type PrFile = {
  filename: string;
  patch?: string | null;
};

type Block = {
  start: number;
  end: number;
  lines: string[];
  span: [number, number];
};

export type SuggestionComment = {
  path: string;
  body: string;
  side: 'RIGHT';
  line: number;
  // GitHub's create-review API requires these field names.
  /* eslint-disable @typescript-eslint/naming-convention */
  start_line?: number;
  start_side?: 'RIGHT';
  /* eslint-enable @typescript-eslint/naming-convention */
};

export type SuggestionPlan = {
  mode: 'suggestions' | 'fallback';
  reason: string;
  hash: string;
  body: string;
  comments: SuggestionComment[];
};

/**
 * Python `str.splitlines`: drop the trailing empty line left by a final newline.
 *
 * @param text - File or diff text.
 * @returns Lines without their break characters.
 */
function splitLines(text: string): string[] {
  if (text === '') {
    return [];
  }
  const lines = text.split(/\r\n|\n|\r/u);
  if (lines[lines.length - 1] === '') {
    lines.pop();
  }
  return lines;
}

/**
 * Python `json.dumps(..., ensure_ascii=True)` for one string.
 *
 * @param value - Raw string.
 * @returns A JSON string literal.
 */
function pythonString(value: string): string {
  // JSON.stringify matches Python's string escapes. Non-ASCII is then written
  // as \uXXXX per UTF-16 code unit, which is json.dumps(ensure_ascii=True).
  let out = '';
  const json = JSON.stringify(value);
  for (let index = 0; index < json.length; index++) {
    const code = json.charCodeAt(index);
    out +=
      code > 0x7f ? `\\u${code.toString(16).padStart(4, '0')}` : json[index];
  }
  return out;
}

/**
 * Python `json.dumps(value, sort_keys=True)` for the comment list.
 *
 * @param value - JSON-like value.
 * @returns Compact JSON with sorted object keys.
 */
function pythonJson(value: unknown): string {
  if (value === null) {
    return 'null';
  }
  if (typeof value === 'number') {
    return JSON.stringify(value);
  }
  if (typeof value === 'string') {
    return pythonString(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => pythonJson(item)).join(', ')}]`;
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    return `{${keys
      .map((key) => `${pythonString(key)}: ${pythonJson(record[key])}`)
      .join(', ')}}`;
  }
  throw new Error(`Cannot encode ${typeof value} as JSON`);
}

/**
 * Parse a git unified diff.
 *
 * Each hunk is `[oldStart, oldCount, newLines]`. `oldCount` 0 is an insert
 * after `oldStart`, or before the file when `oldStart` is 0.
 *
 * @param text - `git diff -U0` output.
 * @returns Hunks keyed by the new file path.
 */
function parseUnifiedDiff(text: string): Record<string, Hunk[]> {
  const files: Record<string, Hunk[]> = {};
  let filePath: string | null = null;
  let hunks: Hunk[] = [];
  let current: Hunk | null = null;

  const finishHunk = () => {
    if (current) {
      hunks.push(current);
      current = null;
    }
  };
  const finishFile = () => {
    finishHunk();
    if (filePath !== null) {
      files[filePath] = hunks;
    }
    filePath = null;
    hunks = [];
  };

  for (const line of splitLines(text)) {
    if (line.startsWith('diff --git ')) {
      finishFile();
      continue;
    }
    if (line.startsWith('Binary files ')) {
      throw new Fallback(
        'A drifted file is binary, so it cannot be suggested.',
      );
    }
    if (line.startsWith('+++ ')) {
      let name = line.slice(4);
      if (name === '/dev/null') {
        throw new Fallback(
          'A drifted file was deleted. Commit suggestion cannot delete a file.',
        );
      }
      if (name.startsWith('b/')) {
        name = name.slice(2);
      }
      filePath = name;
      continue;
    }
    const header = HUNK_HEADER.exec(line);
    if (header) {
      finishHunk();
      const oldStart = Number(header[1]);
      const oldCount = header[2] === undefined ? 1 : Number(header[2]);
      current = [oldStart, oldCount, []];
      continue;
    }
    if (!current || line.startsWith('\\')) {
      continue;
    }
    if (line.startsWith('+')) {
      current[2].push(line.slice(1));
    }
  }
  finishFile();
  if (Object.keys(files).length === 0) {
    throw new Fallback('The drift diff is empty.');
  }
  return files;
}

/**
 * Inclusive right-side line ranges GitHub will accept a comment on.
 *
 * @param patch - The pull request file patch, or null when GitHub omitted it.
 * @returns Ranges of commentable lines in the head file.
 */
function commentableRanges(
  patch: string | null | undefined,
): [number, number][] {
  if (!patch) {
    return [];
  }
  const ranges: [number, number][] = [];
  for (const line of splitLines(patch)) {
    const header = HUNK_HEADER.exec(line);
    if (!header) {
      continue;
    }
    const start = Number(header[3]);
    const count = header[4] === undefined ? 1 : Number(header[4]);
    if (count <= 0 || start <= 0) {
      continue;
    }
    ranges.push([start, start + count - 1]);
  }
  return ranges;
}

/**
 * @param lines - Replacement lines, without trailing breaks.
 * @returns A GitHub suggestion comment body.
 */
function suggestionBody(lines: string[]): string {
  if (lines.some((line) => line.includes('```'))) {
    throw new Fallback(
      'A suggested line contains a code fence, so the comment would break.',
    );
  }
  if (lines.length === 0) {
    return '```suggestion\n```';
  }
  return `\`\`\`suggestion\n${lines.join('\n')}\n\`\`\``;
}

/**
 * Turn one diff hunk into the inclusive head-file lines it replaces.
 *
 * @param oldStart - Hunk start on the head file.
 * @param oldCount - Head lines covered. Zero means an insertion.
 * @param newLines - Added lines from the hunk.
 * @param originalLines - The head file, split into lines.
 * @returns Start, end, and the suggestion lines.
 */
function normalizeHunk(
  oldStart: number,
  oldCount: number,
  newLines: string[],
  originalLines: string[],
): [number, number, string[]] {
  if (oldCount === 0 && oldStart === 0) {
    if (originalLines.length === 0) {
      throw new Fallback(
        'A new line would be inserted into an empty file, which has no line to comment on.',
      );
    }
    return [1, 1, [...newLines, originalLines[0]]];
  }
  if (oldCount === 0) {
    if (oldStart < 1 || oldStart > originalLines.length) {
      throw new Fallback(
        `An insertion after line ${oldStart} does not match the file at this commit.`,
      );
    }
    return [oldStart, oldStart, [originalLines[oldStart - 1], ...newLines]];
  }
  const end = oldStart + oldCount - 1;
  if (oldStart < 1 || end > originalLines.length) {
    throw new Fallback(
      `Lines ${oldStart}-${end} do not match the file at this commit.`,
    );
  }
  return [oldStart, end, [...newLines]];
}

/**
 * @param ranges - Commentable inclusive ranges.
 * @param start - First head line of the suggestion.
 * @param end - Last head line of the suggestion.
 * @returns The pull request hunk that contains the suggestion, if one does.
 */
function covering(
  ranges: [number, number][],
  start: number,
  end: number,
): [number, number] | null {
  for (const [left, right] of ranges) {
    if (left <= start && end <= right) {
      return [left, right];
    }
  }
  return null;
}

/**
 * Merge nearby hunks that share one pull request hunk.
 *
 * @param normalized - Head-line replacements, in diff order.
 * @param originalLines - The head file.
 * @param ranges - Commentable ranges for this file.
 * @returns Merged suggestion blocks.
 */
function mergeHunks(
  normalized: [number, number, string[]][],
  originalLines: string[],
  ranges: [number, number][],
): Block[] {
  const placed: [number, number, string[], [number, number]][] = [];
  for (const [start, end, newLines] of normalized) {
    const span = covering(ranges, start, end);
    if (!span) {
      throw new Fallback(
        `lines ${start}-${end} are not in this pull request diff`,
      );
    }
    placed.push([start, end, newLines, span]);
  }

  const merged: Block[] = [];
  for (const [start, end, newLines, span] of placed) {
    const previous = merged[merged.length - 1];
    if (
      previous &&
      previous.span[0] === span[0] &&
      previous.span[1] === span[1] &&
      start - previous.end - 1 <= COALESCE_GAP
    ) {
      previous.lines.push(...originalLines.slice(previous.end, start - 1));
      previous.lines.push(...newLines);
      previous.end = end;
    } else {
      merged.push({
        start,
        end,
        lines: [...newLines],
        span,
      });
    }
  }
  return merged;
}

/**
 * @param filePath - Repository path of the drifted file.
 * @param block - Merged replacement.
 * @returns One review comment.
 */
function commentFor(filePath: string, block: Block): SuggestionComment {
  const body = suggestionBody(block.lines);
  if (body.length > MAX_SUGGESTION_CHARS) {
    throw new Fallback(
      `A suggestion for ${filePath} would be ${body.length} characters, which is too large to comment.`,
    );
  }
  const comment: SuggestionComment = {
    path: filePath,
    body,
    side: 'RIGHT',
    line: block.end,
  };
  if (block.start < block.end) {
    comment.start_line = block.start;
    comment.start_side = 'RIGHT';
  }
  return comment;
}

/**
 * Build the review when every drifted line can be suggested.
 *
 * @param diffText - Unified diff of the drift.
 * @param prFiles - Pull request files from the GitHub API.
 * @param originals - Head contents keyed by path.
 * @param readable - Affected-API summary already formatted for the comment.
 * @returns A suggestion plan.
 */
function suggestionPlan(
  diffText: string,
  prFiles: PrFile[],
  originals: Record<string, string>,
  readable: string,
): SuggestionPlan {
  const files = parseUnifiedDiff(diffText);
  const byName = new Map(prFiles.map((entry) => [entry.filename, entry]));
  const comments: SuggestionComment[] = [];
  for (const filePath of Object.keys(files).sort()) {
    const entry = byName.get(filePath);
    if (!entry) {
      throw new Fallback(
        `${filePath} is not in this pull request diff, so a suggestion cannot be attached. Run \`yarn test:e2e:sync-api-mocks\` and commit the result.`,
      );
    }
    if (!entry.patch) {
      throw new Fallback(
        `${filePath} is in this pull request, but GitHub omitted its diff because it is too large to comment on. Run \`yarn test:e2e:sync-api-mocks\` and commit the result.`,
      );
    }
    const originalLines = splitLines(originals[filePath] ?? '');
    const normalized = files[filePath].map(([start, count, newLines]) =>
      normalizeHunk(start, count, newLines, originalLines),
    );
    let merged: Block[];
    try {
      merged = mergeHunks(
        normalized,
        originalLines,
        commentableRanges(entry.patch),
      );
    } catch (error) {
      if (error instanceof Fallback) {
        throw new Fallback(
          `${filePath} ${error.message}. Run \`yarn test:e2e:sync-api-mocks\` and commit the result.`,
        );
      }
      throw error;
    }
    for (const block of merged) {
      comments.push(commentFor(filePath, block));
    }
  }

  if (comments.length > MAX_COMMENTS) {
    throw new Fallback(
      `This drift would need ${comments.length} suggestions, which is too many to commit from a review. Run \`yarn test:e2e:sync-api-mocks\` and commit the result.`,
    );
  }
  const total = comments.reduce((sum, comment) => sum + comment.body.length, 0);
  if (total > MAX_TOTAL_CHARS) {
    throw new Fallback(
      `The suggestions would be ${total} characters, which is too large for one review. Run \`yarn test:e2e:sync-api-mocks\` and commit the result.`,
    );
  }

  const digest = createHash('sha256')
    .update(pythonJson(comments))
    .digest('hex');
  const body = [
    REVIEW_MARKER,
    `<!-- e2e-api-mock-sync-review-hash:${digest} -->`,
    '',
    'E2E API mock fixtures differ from the live response shapes. Apply the suggestions on this review and commit them. That commit is authored by you, so the other checks run without a maintainer approval.',
    '',
    'The change is shape-only: existing values stay, new fields are placeholders, and removed fields are dropped.',
    '',
    'Or run `yarn test:e2e:sync-api-mocks` and commit that result.',
    '',
    readable.trim(),
  ].join('\n');
  return {
    mode: 'suggestions',
    reason: '',
    hash: digest,
    body,
    comments,
  };
}

/**
 * Return a suggestion plan, or a fallback plan. Never throws Fallback.
 *
 * @param diffText - Unified diff of the drift.
 * @param prFiles - Pull request files from the GitHub API.
 * @param originals - Head contents keyed by path.
 * @param readable - Affected-API summary.
 * @returns The plan written to `--out`.
 */
export function buildPlan(
  diffText: string,
  prFiles: PrFile[],
  originals: Record<string, string>,
  readable: string,
): SuggestionPlan {
  try {
    return suggestionPlan(diffText, prFiles, originals, readable);
  } catch (error) {
    if (error instanceof Fallback) {
      return {
        mode: 'fallback',
        reason: error.message,
        hash: '',
        body: '',
        comments: [],
      };
    }
    throw error;
  }
}

/**
 * Read each drifted file from HEAD. A missing file is an empty original.
 *
 * @param paths - Paths named by the drift diff.
 * @returns File text keyed by path.
 */
function loadOriginals(paths: string[]): Record<string, string> {
  const originals: Record<string, string> = {};
  for (const filePath of paths) {
    const result = spawnSync('git', ['show', `HEAD:${filePath}`], {
      encoding: 'utf8',
    });
    originals[filePath] = result.status === 0 ? result.stdout : '';
  }
  return originals;
}

/**
 * CLI entry used by the sync workflow.
 *
 * @param argv - Arguments after the script name.
 * @returns Process exit code.
 */
export function main(argv: string[]): number {
  const readArg = (name: string): string => {
    const index = argv.indexOf(name);
    const value = index === -1 ? undefined : argv[index + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`Missing ${name}`);
    }
    return value;
  };
  let diffPath: string;
  let filesPath: string;
  let readablePath: string;
  let outPath: string;
  try {
    diffPath = readArg('--diff');
    filesPath = readArg('--files');
    readablePath = readArg('--readable');
    outPath = readArg('--out');
  } catch {
    return 2;
  }
  const diffText = readFileSync(diffPath, 'utf8');
  const prFiles = JSON.parse(readFileSync(filesPath, 'utf8')) as PrFile[];
  const readable = readFileSync(readablePath, 'utf8');
  let paths: string[] = [];
  try {
    paths = Object.keys(parseUnifiedDiff(diffText));
  } catch (error) {
    if (!(error instanceof Fallback)) {
      throw error;
    }
  }
  const plan = buildPlan(diffText, prFiles, loadOriginals(paths), readable);
  writeFileSync(outPath, JSON.stringify(plan));
  return 0;
}

function invokedDirectly(): boolean {
  const entry = process.argv[1];
  if (!entry) {
    return false;
  }
  if (entry.endsWith('e2e-api-mock-suggestions.mts')) {
    return true;
  }
  return import.meta.url === pathToFileURL(entry).href;
}

if (invokedDirectly()) {
  process.exitCode = main(process.argv.slice(2));
}
