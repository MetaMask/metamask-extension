/**
 * Known Feature Flag Constants
 *
 * Maps constant names (as they appear in source code bracket access) to
 * their resolved flag name strings.  Used by check-feature-flag-registry.ts
 * to resolve bracket-access patterns like `remoteFeatureFlags[CONSTANT]`.
 *
 * ## How values are resolved
 *
 * - **Enum values** (e.g. `FeatureFlagNames`) are imported directly from
 *   the codebase.
 * - **UI selector constants** can't be imported directly (their modules
 *   pull in browser APIs), so they're resolved at startup by reading the
 *   source file and extracting the `export const NAME = 'value'` pattern.
 *
 * ## When to update this file
 *
 * Add an entry here whenever a new constant is used for bracket-access on
 * `remoteFeatureFlags` or `getRemoteFeatureFlags(state)`.  The CI job will
 * fail with an "unresolved constant" error to prompt you.
 *
 * For directly importable constants, add to {@link DIRECT_IMPORTS}.
 * For UI constants with browser dependencies, add to {@link FILE_SOURCES}.
 */

import * as fs from 'fs';
import * as path from 'path';
import { FeatureFlagNames } from '../../shared/modules/feature-flags';

/**
 * Constants whose values can be imported directly at runtime.
 * Key = the expression as it appears in source code.
 * Value = the resolved flag name string.
 */
const DIRECT_IMPORTS: Record<string, string> = {
  'FeatureFlagNames.AssetsDefiPositionsEnabled':
    FeatureFlagNames.AssetsDefiPositionsEnabled,
};

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
    file: 'ui/selectors/assets-unify-state/feature-flags.ts',
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
    const re = new RegExp(
      `export\\s+const\\s+${constantName}\\s*=\\s*['"]([^'"]+)['"]`,
    );
    const match = re.exec(content);
    return match?.[1];
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
