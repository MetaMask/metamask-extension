/**
 * Known Feature Flag Constants — maps constant names to resolved flag strings.
 * Used by check-feature-flag-registry.ts for bracket-access like `remoteFeatureFlags[CONSTANT]`.
 *
 * Enum values are imported directly. UI constants are resolved from source files
 * (importing them would pull in browser APIs). Add new constants here when the
 * CI job reports an "unresolved constant" error.
 */

import * as fs from 'fs';
import * as path from 'path';
import { FeatureFlagNames } from '../../shared/modules/feature-flags';

/** Auto-populated from the FeatureFlagNames enum. Key = `FeatureFlagNames.Member`. */
const DIRECT_IMPORTS: Record<string, string> = Object.fromEntries(
  Object.entries(FeatureFlagNames).map(([k, v]) => [`FeatureFlagNames.${k}`, v]),
);

/**
 * Constants that must be resolved by reading their source file (because
 * importing them would pull in browser-only dependencies).
 */
const FILE_SOURCES: Array<{
  key: string;
  file: string;
  exportName: string;
}> = [
  {
    key: 'ASSETS_UNIFY_STATE_FLAG',
    file: 'shared/lib/assets-unify-state/remote-feature-flag.ts',
    exportName: 'ASSETS_UNIFY_STATE_FLAG',
  },
  {
    key: 'STATE_1_FLAG',
    file: 'ui/selectors/multichain-accounts/feature-flags.ts',
    exportName: 'STATE_1_FLAG',
  },
  {
    key: 'STATE_2_FLAG',
    file: 'ui/selectors/multichain-accounts/feature-flags.ts',
    exportName: 'STATE_2_FLAG',
  },
  {
    key: 'MERKL_FEATURE_FLAG_KEY',
    file: 'ui/components/app/musd/constants.ts',
    exportName: 'MERKL_FEATURE_FLAG_KEY',
  },
];

/**
 * Reads a source file and extracts the string value of an exported constant.
 * Matches patterns like: `export const NAME = 'value';`
 */
function resolveConstantFromFile(
  filePath: string,
  constantName: string,
): string | undefined {
  try {
    const fullPath = path.resolve(filePath);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const escaped = constantName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(
      `export\\s+const\\s+${escaped}(?:\\s*:[^=]+)?\\s*=\\s*(?:'([^']+)'|"([^"]+)"|` + '`([^`]+)`)',
    );
    const match = re.exec(content);
    return match?.[1] ?? match?.[2] ?? match?.[3];
  } catch {
    return undefined;
  }
}

/**
 * Builds and returns the complete mapping of constant expressions to
 * their resolved flag name strings.
 */
export function buildKnownFlagConstants(): Record<string, string> {
  const constants: Record<string, string> = { ...DIRECT_IMPORTS };

  for (const { key, file, exportName } of FILE_SOURCES) {
    const resolved = resolveConstantFromFile(file, exportName);
    if (resolved) {
      constants[key] = resolved;
    }
  }

  return constants;
}
