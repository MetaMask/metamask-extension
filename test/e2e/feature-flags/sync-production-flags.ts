#!/usr/bin/env tsx
/**
 * Production Feature Flag Sync Script
 *
 * Fetches feature flags from the production client-config API, compares them
 * to the local registry, and reports any drift:
 * - New flags in production not in registry
 * - Flags in registry no longer in production
 * - Value mismatches between registry and production
 *
 * Usage:
 * yarn feature-flags:sync - Report differences, exit 0 (manual use)
 * yarn feature-flags:sync:check - Report differences, exit 1 if drift (CI)
 * yarn feature-flags:sync:update - Report differences, auto-update registry if drift
 *
 * Exit codes (sync:check):
 * 0 - No drift
 * 1 - Drift detected
 * 2 - Script/API error (network failure, parse error, etc.)
 *
 * @see {@link https://client-config.api.cx.metamask.io/v1/flags?client=extension&distribution=main&environment=prod}
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

import { cloneDeep, isEqual } from 'lodash';
import type { Json } from '@metamask/utils';
import chalk from 'chalk';
import {
  FEATURE_FLAG_REGISTRY,
  FeatureFlagStatus,
  FeatureFlagType,
  getProductionRemoteFlagDefaults,
} from './feature-flag-registry';
import type { FeatureFlagRegistryEntry } from './feature-flag-registry';

const PRODUCTION_FLAGS_URL =
  'https://client-config.api.cx.metamask.io/v1/flags?client=extension&distribution=main&environment=prod';

/**
 * Flags excluded from drift comparison (e.g. frequently changing version values).
 */
const EXCLUDED_FLAGS: ReadonlySet<string> = new Set([
  'extensionUpdatePromptMinimumVersion',
]);

// ============================================================================
// Types
// ============================================================================

export type SyncResult = {
  newInProduction: { name: string; value: unknown }[];
  removedFromProduction: { name: string; registryValue: unknown }[];
  valueMismatches: {
    name: string;
    productionValue: unknown;
    registryValue: unknown;
  }[];
  inProdMismatches: {
    name: string;
    productionValue: unknown;
  }[];
  hasDrift: boolean;
};

/**
 * Parses the production API response (array of single-key objects) into a flat map.
 * Skips and warns for unexpected formats (multi-key or empty objects).
 *
 * @param response - Raw API response array
 * @returns Flat map of flag name to value
 */
function parseProductionResponse(
  response: Record<string, unknown>[],
): Record<string, unknown> {
  const map: Record<string, unknown> = {};
  for (const item of response) {
    if (item && typeof item === 'object') {
      const keys = Object.keys(item);
      if (keys.length === 1) {
        map[keys[0]] = item[keys[0]];
      } else if (keys.length > 1) {
        console.warn(
          `[sync] Skipping unexpected multi-key object (expected single-key): ${JSON.stringify(item)}`,
        );
      }
    }
  }
  return map;
}

/**
 * Minimal registry entry shape for inProd check.
 * Used by fullRegistryOverride in tests.
 */
type FullRegistryEntry = { inProd?: boolean };

/**
 * Compares production flags to the registry and returns drift information.
 *
 * @param productionApiResponse - Raw API response (array of { flagName: value })
 * @param registryMap - Optional. Override for testing; defaults to getProductionRemoteFlagDefaults()
 * @param fullRegistryOverride - Optional. Override for FEATURE_FLAG_REGISTRY when checking inProd; for tests only
 * @returns SyncResult with new, removed, and mismatched flags
 */
export function compareProductionFlagsToRegistry(
  productionApiResponse: Record<string, unknown>[],
  registryMap?: Record<string, unknown>,
  fullRegistryOverride?: Record<string, FullRegistryEntry>,
): SyncResult {
  const prodMap = parseProductionResponse(productionApiResponse);
  const registry = (registryMap ?? getProductionRemoteFlagDefaults()) as Record<
    string,
    unknown
  >;

  const prodKeys = new Set(Object.keys(prodMap));
  const registryKeys = new Set(Object.keys(registry));

  const newInProduction: SyncResult['newInProduction'] = [];
  const removedFromProduction: SyncResult['removedFromProduction'] = [];
  const valueMismatches: SyncResult['valueMismatches'] = [];
  const inProdMismatches: SyncResult['inProdMismatches'] = [];

  for (const name of prodKeys) {
    if (EXCLUDED_FLAGS.has(name)) {
      continue;
    }
    if (!registryKeys.has(name)) {
      // Flag is in production but not in the filtered registry (inProd: true only).
      // Check if it exists in the full registry with inProd: false (stale metadata).
      const fullRegistry = fullRegistryOverride ?? FEATURE_FLAG_REGISTRY;
      const fullEntry = fullRegistry[name] as FullRegistryEntry | undefined;
      if (fullEntry && fullEntry.inProd === false) {
        inProdMismatches.push({
          name,
          productionValue: prodMap[name],
        });
      } else {
        newInProduction.push({ name, value: prodMap[name] });
      }
    } else if (!isEqual(prodMap[name], registry[name])) {
      valueMismatches.push({
        name,
        productionValue: prodMap[name],
        registryValue: registry[name],
      });
    }
  }

  for (const name of registryKeys) {
    if (EXCLUDED_FLAGS.has(name)) {
      continue;
    }
    if (!prodKeys.has(name)) {
      removedFromProduction.push({
        name,
        registryValue: registry[name],
      });
    }
  }

  const hasDrift =
    newInProduction.length > 0 ||
    removedFromProduction.length > 0 ||
    valueMismatches.length > 0 ||
    inProdMismatches.length > 0;

  return {
    newInProduction,
    removedFromProduction,
    valueMismatches,
    inProdMismatches,
    hasDrift,
  };
}

const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 1000;

/**
 * Fetches feature flags from the production API with retry on transient failure.
 */
export async function fetchProductionFlags(): Promise<
  Record<string, unknown>[]
> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(PRODUCTION_FLAGS_URL);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch production flags: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error(
          `Unexpected API response format: expected array, got ${typeof data}`,
        );
      }

      return data as Record<string, unknown>[];
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < MAX_RETRIES) {
        const delay = INITIAL_DELAY_MS * 2 ** (attempt - 1);
        console.warn(
          `[sync] Fetch attempt ${attempt}/${MAX_RETRIES} failed: ${lastError.message}. Retrying in ${delay}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError ?? new Error('Failed to fetch production flags');
}

/**
 * Formats the sync result for console output.
 * @param result
 */
function formatSyncReport(result: SyncResult): string {
  const lines: string[] = [];
  const header = chalk.green.bold;
  const sectionTitle = chalk.green.bold;

  lines.push('');
  lines.push(header('=== Feature Flag Registry Sync Report ==='));
  lines.push('');

  if (!result.hasDrift) {
    lines.push(chalk.green('✓ Registry is in sync with production.'));
    return lines.join('\n');
  }

  if (result.newInProduction.length > 0) {
    lines.push(
      sectionTitle(
        `New flags in production (not in registry) [${result.newInProduction.length}]:`,
      ),
    );
    for (const { name, value } of result.newInProduction) {
      lines.push(`  - ${chalk.red(name)}: ${JSON.stringify(value)}`);
    }
    lines.push('');
  }

  if (result.removedFromProduction.length > 0) {
    lines.push(
      sectionTitle(
        `Flags in registry no longer in production [${result.removedFromProduction.length}]:`,
      ),
    );
    for (const { name } of result.removedFromProduction) {
      lines.push(chalk.red(`  - ${name}`));
    }
    lines.push('');
  }

  if (result.valueMismatches.length > 0) {
    const { valueMismatches } = result;
    lines.push(
      sectionTitle(
        `Value mismatches (registry vs production) [${valueMismatches.length}]:`,
      ),
    );
    for (const { name, productionValue, registryValue } of valueMismatches) {
      lines.push(chalk.red(`  - ${name}:`));
      lines.push(`      registry:   ${JSON.stringify(registryValue)}`);
      lines.push(`      production: ${JSON.stringify(productionValue)}`);
    }
    lines.push('');
  }

  if (result.inProdMismatches.length > 0) {
    lines.push(
      sectionTitle(
        `inProd mismatch: flags in registry with inProd: false but present in production [${result.inProdMismatches.length}]:`,
      ),
    );
    for (const { name, productionValue } of result.inProdMismatches) {
      lines.push(
        chalk.magenta(
          `  - ${name}: production value ${JSON.stringify(productionValue)} — update inProd to true in registry`,
        ),
      );
    }
    lines.push('');
  }

  lines.push('');

  // Summary at end
  if (result.hasDrift) {
    const { green } = chalk;
    lines.push(sectionTitle('--- Summary ---'));
    lines.push(
      `  ${green('New flags in production')}: ${result.newInProduction.length}`,
    );
    lines.push(
      `  ${green('Flags removed from production')}: ${result.removedFromProduction.length}`,
    );
    lines.push(
      `  ${green('Value mismatches')}: ${result.valueMismatches.length}`,
    );
    lines.push(
      `  ${green('inProd mismatches')}: ${result.inProdMismatches.length}`,
    );
    lines.push(
      `  ${green('Total drift')}: ${result.newInProduction.length + result.removedFromProduction.length + result.valueMismatches.length + result.inProdMismatches.length}`,
    );
    lines.push('');
  }

  lines.push(
    `${chalk.bold.red('To fix: Update test/e2e/feature-flags/feature-flag-registry.ts and run yarn feature-flags:sync to verify.')}`,
  );
  lines.push('');

  return lines.join('\n');
}

// ============================================================================
// --update mode: write production values back to registry file
// ============================================================================

const REGISTRY_FILE_PATH = path.resolve(__dirname, 'feature-flag-registry.ts');

/**
 * Registry keys that use computed property syntax instead of string literals.
 */
const COMPUTED_REGISTRY_KEYS: Readonly<Record<string, string>> = {
  enabledAdvancedPermissions: '[ENABLED_ADVANCED_PERMISSIONS_FEATURE_FLAG]',
  extensionUxActiveDomainMetrics: '[ACTIVE_TAB_DOMAIN_METRICS_FLAG]',
};

const COMPUTED_KEY_TO_NAME: Readonly<Record<string, string>> =
  Object.fromEntries(
    Object.entries(COMPUTED_REGISTRY_KEYS).map(([name, keySyntax]) => [
      keySyntax.slice(1, -1),
      name,
    ]),
  );

/**
 * Recursively sorts object keys alphabetically for deterministic serialization.
 * Arrays preserve element order; only object keys are sorted.
 *
 * @param value - Value to normalize
 * @returns Copy with sorted object keys at every nesting level
 */
export function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeysDeep);
  }
  if (value !== null && typeof value === 'object') {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      sorted[key] = sortKeysDeep((value as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return value;
}

function serializeValue(value: unknown, indent = 0): string {
  const json = JSON.stringify(sortKeysDeep(value), null, 2);
  if (indent <= 0) {
    return json;
  }
  const pad = ' '.repeat(indent);
  return json
    .split('\n')
    .map((line, i) => (i === 0 ? line : `${pad}${line}`))
    .join('\n');
}

/**
 * Scans forward from an opening `{` or `[`, tracking brace/bracket depth
 * and skipping string literals, and returns the index just past the
 * balanced closing delimiter. Returns -1 if unbalanced.
 *
 * @param content - The source text
 * @param openIndex - Index of the opening `{` or `[`
 */
function findBalancedEnd(content: string, openIndex: number): number {
  let depth = 0;
  let inSingle = false;
  let inDouble = false;
  let i = openIndex;
  while (i < content.length) {
    const ch = content[i];
    if (inSingle) {
      if (ch === '\\') {
        i += 1;
      } else if (ch === "'") {
        inSingle = false;
      }
    } else if (inDouble) {
      if (ch === '\\') {
        i += 1;
      } else if (ch === '"') {
        inDouble = false;
      }
    } else if (ch === "'") {
      inSingle = true;
    } else if (ch === '"') {
      inDouble = true;
    } else if (ch === '/' && i + 1 < content.length) {
      const next = content[i + 1];
      if (next === '/') {
        const eol = content.indexOf('\n', i);
        i = eol === -1 ? content.length : eol;
      } else if (next === '*') {
        const close = content.indexOf('*/', i + 2);
        i = close === -1 ? content.length : close + 1;
      }
    } else if (ch === '{' || ch === '[') {
      depth += 1;
    } else if (ch === '}' || ch === ']') {
      depth -= 1;
      if (depth === 0) {
        return i + 1;
      }
    }
    i += 1;
  }
  return -1;
}

type RegistryEntryBlock = {
  sortKey: string;
  text: string;
};

const REGISTRY_START =
  'export const FEATURE_FLAG_REGISTRY: Record<string, FeatureFlagRegistryEntry> = {';
const REGISTRY_ESLINT_DISABLE =
  '/* eslint-disable @typescript-eslint/naming-convention -- production API flag names */';
const REGISTRY_ESLINT_ENABLE =
  '/* eslint-enable @typescript-eslint/naming-convention */';
const REGISTRY_END_MARKER = '\n};';
const REGISTRY_HELPER_MARKER = '// Helper Functions';

function findRegistryBodyEnd(content: string, openBrace: number): number {
  const helperIndex = content.indexOf(REGISTRY_HELPER_MARKER, openBrace);
  if (helperIndex !== -1) {
    return content.lastIndexOf(REGISTRY_END_MARKER, helperIndex);
  }
  return content.indexOf(REGISTRY_END_MARKER, openBrace);
}

function getRegistryKeyLine(name: string): string {
  return COMPUTED_REGISTRY_KEYS[name] ?? name;
}

function buildRegistryEntryBlockFromEntry(
  name: string,
  entry: FeatureFlagRegistryEntry,
): string {
  const serialized = serializeValue(entry.productionDefault, 4);
  const keyLine = getRegistryKeyLine(name);
  const typeName = entry.type === FeatureFlagType.Remote ? 'Remote' : 'Build';
  const statusName =
    entry.status === FeatureFlagStatus.Active ? 'Active' : 'Deprecated';

  return [
    `  ${keyLine}: {`,
    `    inProd: ${entry.inProd},`,
    `    name: '${entry.name.replace(/'/gu, "\\'")}',`,
    `    productionDefault: ${serialized},`,
    `    status: FeatureFlagStatus.${statusName},`,
    `    type: FeatureFlagType.${typeName},`,
    '  },',
  ].join('\n');
}

/**
 * Applies drift changes from a sync result onto a copy of the in-memory registry.
 *
 * @param result - Drift detected between production and the registry
 * @param baseRegistry
 * @returns Updated registry entries keyed by flag name
 */
export function applySyncResultToRegistry(
  result: SyncResult,
  baseRegistry: Record<
    string,
    FeatureFlagRegistryEntry
  > = FEATURE_FLAG_REGISTRY,
): Record<string, FeatureFlagRegistryEntry> {
  const merged: Record<string, FeatureFlagRegistryEntry> = {};

  for (const [name, entry] of Object.entries(baseRegistry)) {
    merged[name] = cloneDeep(entry);
  }

  for (const { name, productionValue } of result.valueMismatches) {
    if (merged[name]) {
      merged[name] = {
        ...merged[name],
        productionDefault: productionValue as Json,
      };
    }
  }

  for (const { name, productionValue } of result.inProdMismatches) {
    if (merged[name]) {
      merged[name] = {
        ...merged[name],
        inProd: true,
        productionDefault: productionValue as Json,
      };
    }
  }

  for (const { name } of result.removedFromProduction) {
    delete merged[name];
  }

  for (const { name, value } of result.newInProduction) {
    merged[name] = {
      name,
      type: FeatureFlagType.Remote,
      inProd: true,
      productionDefault: value as Json,
      status: FeatureFlagStatus.Active,
    };
  }

  return merged;
}

/**
 * Extracts leading comment lines attached to registry entries.
 *
 * @param content - Full registry file source
 */
function extractEntryComments(content: string): Map<string, string> {
  const commentByFlag = new Map<string, string>();
  for (const block of extractRegistryEntryBlocks(content)) {
    const commentMatch = block.text.match(/^((?:[ \t]*\/\/[^\n]*\n)+)/u);
    if (commentMatch) {
      commentByFlag.set(block.sortKey, commentMatch[1]);
    }
  }
  return commentByFlag;
}

/**
 * Extracts comment lines that appear *inside* an entry block (between the
 * opening `{` and closing `},`). These are distinct from the leading comments
 * captured by `extractEntryComments`.
 *
 * @param content - Full registry file source
 */
function extractIntraEntryComments(content: string): Map<string, string[]> {
  const result = new Map<string, string[]>();
  for (const block of extractRegistryEntryBlocks(content)) {
    const braceIndex = block.text.indexOf('{');
    if (braceIndex === -1) {
      continue;
    }
    const inner = block.text.slice(braceIndex + 1);
    const comments: string[] = [];
    for (const line of inner.split('\n')) {
      if (line.trim().startsWith('//')) {
        comments.push(line);
      }
    }
    if (comments.length > 0) {
      result.set(block.sortKey, comments);
    }
  }
  return result;
}

/**
 * Rebuilds the registry block with sorted entries and deep-sorted productionDefault keys.
 *
 * @param content - Full registry file source
 * @param registry - Registry entries to render
 */
export function rebuildRegistryContent(
  content: string,
  registry: Record<string, FeatureFlagRegistryEntry>,
): string {
  const commentByFlag = extractEntryComments(content);
  const intraCommentByFlag = extractIntraEntryComments(content);
  const sortedNames = Object.keys(registry).sort((a, b) => a.localeCompare(b));
  const blocks = sortedNames.map((name) => {
    let entryBlock = buildRegistryEntryBlockFromEntry(name, registry[name]);
    const intraComments = intraCommentByFlag.get(name);
    if (intraComments) {
      const braceIdx = entryBlock.indexOf('{');
      entryBlock = `${entryBlock.slice(0, braceIdx + 1)}\n${intraComments.join('\n')}${entryBlock.slice(braceIdx + 1)}`;
    }
    const comment = commentByFlag.get(name);
    return comment ? `${comment}${entryBlock}` : entryBlock;
  });

  const registryStart = content.indexOf(REGISTRY_START);
  if (registryStart === -1) {
    throw new Error('Could not locate FEATURE_FLAG_REGISTRY block');
  }
  const openBrace = content.indexOf('{', registryStart);
  const registryEnd = findRegistryBodyEnd(content, openBrace);
  if (openBrace === -1 || registryEnd === -1) {
    throw new Error('Could not locate FEATURE_FLAG_REGISTRY block');
  }

  return `${content.slice(0, openBrace + 1)}\n${blocks.join('\n\n')}\n${content.slice(registryEnd)}`;
}

/**
 * Extracts the sort key (`name` field) from a registry entry block.
 *
 * @param blockText - Source text for a single registry entry
 */
function extractEntrySortKey(blockText: string): string {
  const quotedNameMatch = blockText.match(/^\s*name:\s*'([^']+)'/mu);
  if (quotedNameMatch) {
    return quotedNameMatch[1];
  }

  const unquotedNameMatch = blockText.match(/^\s*name:\s*(\w+)/mu);
  if (unquotedNameMatch) {
    const resolvedName = COMPUTED_KEY_TO_NAME[unquotedNameMatch[1]];
    if (resolvedName) {
      return resolvedName;
    }
  }

  const computedKeyMatch = blockText.match(/^\s*\[([^\]]+)\]:/mu);
  if (computedKeyMatch) {
    const resolvedName = COMPUTED_KEY_TO_NAME[computedKeyMatch[1]];
    if (resolvedName) {
      return resolvedName;
    }
  }

  const literalKeyMatch = blockText.match(/^\s*([\w]+):\s*\{/mu);
  return literalKeyMatch?.[1] ?? '';
}

/**
 * Parses registry entry blocks from the registry file content.
 *
 * @param content - Full registry file source
 */
function extractRegistryEntryBlocks(content: string): RegistryEntryBlock[] {
  const registryStart = content.indexOf(REGISTRY_START);
  if (registryStart === -1) {
    return [];
  }

  const openBrace = content.indexOf('{', registryStart);
  const registryEnd = findRegistryBodyEnd(content, openBrace);
  if (openBrace === -1 || registryEnd === -1) {
    return [];
  }

  const blocks: RegistryEntryBlock[] = [];
  let index = openBrace + 1;

  while (index < registryEnd) {
    while (index < registryEnd && /\s/u.test(content[index])) {
      index += 1;
    }
    if (index >= registryEnd) {
      break;
    }

    let commentStart = -1;
    let scanIndex = index;
    while (
      scanIndex < registryEnd &&
      content.slice(scanIndex, scanIndex + 2) === '//'
    ) {
      if (commentStart === -1) {
        commentStart = scanIndex;
      }
      const lineEnd = content.indexOf('\n', scanIndex);
      scanIndex = lineEnd === -1 ? registryEnd : lineEnd + 1;
      while (
        scanIndex < registryEnd &&
        /\s/u.test(content[scanIndex]) &&
        content[scanIndex] !== '\n'
      ) {
        scanIndex += 1;
      }
      if (scanIndex < registryEnd && content[scanIndex] === '\n') {
        scanIndex += 1;
      }
      while (scanIndex < registryEnd && /[ \t]/u.test(content[scanIndex])) {
        scanIndex += 1;
      }
    }
    index = scanIndex;

    const entryMatch = content
      .slice(index)
      .match(/^(\s*(?:\[[^\]]+\]|[A-Za-z_][\w]*):\s*\{)/u);
    if (!entryMatch) {
      index += 1;
      continue;
    }

    const blockStart = commentStart === -1 ? index : commentStart;

    const entryOpenBrace = content.indexOf('{', index);
    const entryEnd = findBalancedEnd(content, entryOpenBrace);
    if (entryEnd === -1) {
      break;
    }

    let blockEnd = entryEnd;
    if (blockEnd < content.length && content[blockEnd] === ',') {
      blockEnd += 1;
    }

    const blockText = content.slice(blockStart, blockEnd);
    blocks.push({
      sortKey: extractEntrySortKey(blockText),
      text: blockText,
    });

    index = blockEnd;
  }

  return blocks;
}

export function ensureRegistryEslintWrappers(content: string): string {
  let updated = content.replace(
    /\s*\/\* eslint-disable @typescript-eslint\/naming-convention[^\n]*\*\/\s*\nexport const FEATURE_FLAG_REGISTRY/u,
    '\nexport const FEATURE_FLAG_REGISTRY',
  );
  updated = updated.replace(
    /\n\/\* eslint-enable @typescript-eslint\/naming-convention \*\/\n/gu,
    '\n',
  );

  updated = updated.replace(
    /export const FEATURE_FLAG_REGISTRY/u,
    `${REGISTRY_ESLINT_DISABLE}\nexport const FEATURE_FLAG_REGISTRY`,
  );

  const helperMarker = REGISTRY_HELPER_MARKER;
  const helperIndex = updated.indexOf(helperMarker);
  if (helperIndex === -1) {
    return updated;
  }

  const registryEnd = updated.lastIndexOf(REGISTRY_END_MARKER, helperIndex);
  if (registryEnd !== -1) {
    updated = `${updated.slice(0, registryEnd + 3)}\n${REGISTRY_ESLINT_ENABLE}${updated.slice(registryEnd + 3)}`;
  }

  return updated;
}

/**
 * Updates the feature-flag-registry.ts file with production values.
 * Rebuilds the full registry from merged in-memory state so every entry
 * is alphabetically ordered and productionDefault keys are deep-sorted.
 *
 * @param result - Drift detected between production and the registry
 */
async function updateRegistryFile(result: SyncResult): Promise<void> {
  let content = fs.readFileSync(REGISTRY_FILE_PATH, 'utf-8');
  const today = new Date().toISOString().split('T')[0];

  content = content.replace(
    /Production defaults last synced: \d{4}-\d{2}-\d{2}/u,
    `Production defaults last synced: ${today}`,
  );

  const mergedRegistry = applySyncResultToRegistry(result);
  content = rebuildRegistryContent(content, mergedRegistry);
  content = ensureRegistryEslintWrappers(content);

  const original = fs.readFileSync(REGISTRY_FILE_PATH, 'utf-8');
  fs.writeFileSync(REGISTRY_FILE_PATH, content, 'utf-8');
  try {
    execSync(`yarn oxfmt -c oxfmt.config.mts "${REGISTRY_FILE_PATH}"`, {
      cwd: path.resolve(__dirname, '../../..'),
      stdio: 'pipe',
    });
  } catch (error) {
    fs.writeFileSync(REGISTRY_FILE_PATH, original, 'utf-8');
    throw error;
  }
  console.log(chalk.green(`\n✓ Registry file updated: ${REGISTRY_FILE_PATH}`));
  console.log(chalk.yellow('Run `yarn feature-flags:sync` to verify.'));
}

// ============================================================================
// CLI
// ============================================================================

async function main(): Promise<void> {
  const checkMode = process.argv.includes('--check');
  const updateMode = process.argv.includes('--update');

  try {
    const productionResponse = await fetchProductionFlags();
    const result = compareProductionFlagsToRegistry(productionResponse);

    fs.writeFileSync(
      'sync-report.json',
      JSON.stringify(result, null, 2),
      'utf-8',
    );

    console.log(formatSyncReport(result));

    if (updateMode && result.hasDrift) {
      await updateRegistryFile(result);
      process.exit(0);
    }

    if (checkMode && result.hasDrift) {
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${message}`);
    process.exit(2); // 2 = script/API error; 1 is reserved for drift
  }
}

// Only run when executed directly (not when imported for tests or scripts)
const isDirectExecution =
  typeof jest === 'undefined' &&
  Boolean(process.argv[1]?.includes('sync-production-flags'));

if (isDirectExecution) {
  main();
}
