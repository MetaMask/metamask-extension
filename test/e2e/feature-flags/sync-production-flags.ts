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
 *
 * Exit codes (sync:check):
 * 0 - No drift
 * 1 - Drift detected
 * 2 - Script/API error (network failure, parse error, etc.)
 *
 * @see {@link https://client-config.api.cx.metamask.io/v1/flags?client=extension&distribution=main&environment=prod}
 */

import { isEqual } from 'lodash';
import chalk from 'chalk';
import {
  FEATURE_FLAG_REGISTRY,
  FeatureFlagType,
  getProductionRemoteFlagDefaults,
} from './feature-flag-registry';

const PRODUCTION_FLAGS_URL =
  'https://client-config.api.cx.metamask.io/v1/flags?client=extension&distribution=main&environment=prod';

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
 * @param response
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
      }
    }
  }
  return map;
}

/**
 * Compares production flags to the registry and returns drift information.
 *
 * @param productionApiResponse - Raw API response (array of { flagName: value })
 * @returns SyncResult with new, removed, and mismatched flags
 */
export function compareProductionFlagsToRegistry(
  productionApiResponse: Record<string, unknown>[],
): SyncResult {
  const prodMap = parseProductionResponse(productionApiResponse);
  const registryMap = getProductionRemoteFlagDefaults() as Record<
    string,
    unknown
  >;

  const prodKeys = new Set(Object.keys(prodMap));
  const registryKeys = new Set(
    Object.entries(FEATURE_FLAG_REGISTRY)
      .filter(
        ([, entry]) => entry.type === FeatureFlagType.Remote && entry.inProd,
      )
      .map(([name]) => name),
  );

  const newInProduction: SyncResult['newInProduction'] = [];
  const removedFromProduction: SyncResult['removedFromProduction'] = [];
  const valueMismatches: SyncResult['valueMismatches'] = [];

  for (const name of prodKeys) {
    if (!registryKeys.has(name)) {
      newInProduction.push({ name, value: prodMap[name] });
    } else if (!isEqual(prodMap[name], registryMap[name])) {
      valueMismatches.push({
        name,
        productionValue: prodMap[name],
        registryValue: registryMap[name],
      });
    }
  }

  for (const name of registryKeys) {
    if (!prodKeys.has(name)) {
      removedFromProduction.push({
        name,
        registryValue: registryMap[name],
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

/**
 * Fetches feature flags from the production API.
 */
export async function fetchProductionFlags(): Promise<
  Record<string, unknown>[]
> {
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
    for (const {
      name,
      productionValue,
      registryValue,
    } of valueMismatches) {
      lines.push(chalk.red(`  - ${name}:`));
      lines.push(`      registry:   ${JSON.stringify(registryValue)}`);
      lines.push(`      production: ${JSON.stringify(productionValue)}`);
    }
  }

  lines.push('');

  // Summary at end
  if (result.hasDrift) {
    const green = chalk.green;
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
// CLI
// ============================================================================

async function main(): Promise<void> {
  const checkMode = process.argv.includes('--check');

  try {
    const productionResponse = await fetchProductionFlags();
    const result = compareProductionFlagsToRegistry(productionResponse);

    console.log(formatSyncReport(result));

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
