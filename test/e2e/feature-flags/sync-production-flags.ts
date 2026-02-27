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

import { isEqual } from 'lodash';
import chalk from 'chalk';
import { getProductionRemoteFlagDefaults } from './feature-flag-registry';

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
 * Compares production flags to the registry and returns drift information.
 *
 * @param productionApiResponse - Raw API response (array of { flagName: value })
 * @param registryMap - Optional. Override for testing; defaults to getProductionRemoteFlagDefaults()
 * @returns SyncResult with new, removed, and mismatched flags
 */
export function compareProductionFlagsToRegistry(
  productionApiResponse: Record<string, unknown>[],
  registryMap?: Record<string, unknown>,
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

  for (const name of prodKeys) {
    if (EXCLUDED_FLAGS.has(name)) {
      continue;
    }
    if (!registryKeys.has(name)) {
      newInProduction.push({ name, value: prodMap[name] });
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
    valueMismatches.length > 0;

  return {
    newInProduction,
    removedFromProduction,
    valueMismatches,
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
      `  ${green('Total drift')}: ${result.newInProduction.length + result.removedFromProduction.length + result.valueMismatches.length}`,
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

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

function serializeValue(value: unknown, indent = 0): string {
  const json = JSON.stringify(value, null, 2);
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

/**
 * Updates the feature-flag-registry.ts file with production values.
 * Handles value mismatches, new flags, and removed flags.
 * Uses brace-depth counting (not regex) to correctly handle nested objects.
 * Formats the file with Prettier before writing.
 * @param result
 */
async function updateRegistryFile(result: SyncResult): Promise<void> {
  let content = fs.readFileSync(REGISTRY_FILE_PATH, 'utf-8');
  const today = new Date().toISOString().split('T')[0];

  content = content.replace(
    /Production defaults last synced: \d{4}-\d{2}-\d{2}/u,
    `Production defaults last synced: ${today}`,
  );

  // Replace mismatched productionDefault values using brace-depth counting
  for (const { name, productionValue } of result.valueMismatches) {
    const serialized = serializeValue(productionValue, 4);
    const entryPattern = new RegExp(`^  ${escapeRegex(name)}:\\s*\\{`, 'mu');
    const entryMatch = entryPattern.exec(content);
    if (!entryMatch) {
      continue;
    }

    const entryOpenBrace = content.indexOf('{', entryMatch.index + name.length);
    const entryEnd = findBalancedEnd(content, entryOpenBrace);
    if (entryEnd === -1) {
      continue;
    }

    const pdNeedle = 'productionDefault:';
    const pdIndex = content.indexOf(pdNeedle, entryMatch.index);
    if (pdIndex === -1 || pdIndex >= entryEnd) {
      continue;
    }

    let valueStart = pdIndex + pdNeedle.length;
    while (valueStart < entryEnd && /\s/u.test(content[valueStart])) {
      valueStart += 1;
    }

    let valueEnd: number;
    const firstChar = content[valueStart];
    if (firstChar === '{' || firstChar === '[') {
      valueEnd = findBalancedEnd(content, valueStart);
      if (valueEnd === -1) {
        continue;
      }
    } else {
      valueEnd = valueStart;
      while (valueEnd < entryEnd && content[valueEnd] !== ',') {
        const ch = content[valueEnd];
        if (ch === "'" || ch === '"') {
          valueEnd += 1;
          while (valueEnd < entryEnd && content[valueEnd] !== ch) {
            if (content[valueEnd] === '\\') {
              valueEnd += 1;
            }
            valueEnd += 1;
          }
          if (valueEnd < entryEnd) {
            valueEnd += 1;
          }
        } else {
          valueEnd += 1;
        }
      }
    }

    content = `${content.slice(0, valueStart)}${serialized}${content.slice(valueEnd)}`;
  }

  // Remove entries no longer in production using brace-depth counting
  for (const { name } of result.removedFromProduction) {
    const entryPattern = new RegExp(`^  ${escapeRegex(name)}:\\s*\\{`, 'mu');
    const entryMatch = entryPattern.exec(content);
    if (!entryMatch) {
      continue;
    }

    const openBrace = content.indexOf('{', entryMatch.index + name.length);
    const balancedEnd = findBalancedEnd(content, openBrace);
    if (balancedEnd === -1) {
      continue;
    }

    let removeEnd = balancedEnd;
    if (removeEnd < content.length && content[removeEnd] === ',') {
      removeEnd += 1;
    }
    if (removeEnd < content.length && content[removeEnd] === '\n') {
      removeEnd += 1;
    }

    let removeStart = entryMatch.index;
    // Include preceding eslint-disable comment if present
    const beforeEntry = content.lastIndexOf('\n', removeStart - 1);
    if (beforeEntry >= 0) {
      const prevLineStart = content.lastIndexOf('\n', beforeEntry - 1) + 1;
      const prevLine = content.slice(prevLineStart, beforeEntry).trim();
      if (prevLine.startsWith('// eslint-disable')) {
        removeStart = prevLineStart;
      }
    }
    // Include leading blank line to avoid double blank lines
    if (removeStart > 0 && content[removeStart - 1] === '\n') {
      removeStart -= 1;
    }

    content = content.slice(0, removeStart) + content.slice(removeEnd);
  }

  if (result.newInProduction.length > 0) {
    const newEntries = result.newInProduction
      .map(({ name, value }) => {
        const serialized = serializeValue(value, 4);
        return [
          `  ${name}: {`,
          `    name: '${name.replace(/'/gu, "\\'")}',`,
          '    type: FeatureFlagType.Remote,',
          '    inProd: true,',
          `    productionDefault: ${serialized},`,
          '    status: FeatureFlagStatus.Active,',
          '  },',
        ].join('\n');
      })
      .join('\n\n');

    content = content.replace(
      /(\n)(\};[\s\n]*\/\/ =+\s*\n\/\/ Helper Functions)/u,
      (_, g1, g2) => `\n${newEntries}\n${g1}${g2}`,
    );
  }

  const prettier = (await import('prettier')).default;
  const prettierOptions = await prettier.resolveConfig(REGISTRY_FILE_PATH);
  const formatted = await prettier.format(content, {
    ...prettierOptions,
    filepath: REGISTRY_FILE_PATH,
  });
  fs.writeFileSync(REGISTRY_FILE_PATH, formatted ?? content, 'utf-8');
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

// Only run when executed directly (not when imported for tests)
if (typeof jest === 'undefined') {
  main();
}
