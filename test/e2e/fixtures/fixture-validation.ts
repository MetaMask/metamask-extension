import path from 'path';
import fs from 'fs-extra';
import { get, set, unset, isEqual, truncate } from 'lodash';
import { shouldIgnoreKey } from '../helpers';
import {
  createTypeMap,
  type StateLogsTypeMap,
} from '../tests/settings/state-logs-helpers';

/**
 * Represents the differences between two fixture schemas.
 * Used to track what has changed between an existing fixture and a new state.
 */
export type FixtureSchemaDiff = {
  /** Keys that exist in the new state but not in the baseline fixture */
  newKeys: string[];
  /** Keys that exist in the baseline fixture but not in the new state */
  missingKeys: string[];
  /** Keys that exist in both but have different types */
  typeMismatches: string[];
  /** Keys that exist in both with same type but different primitive values */
  valueMismatches: string[];
};

/**
 * A JSON-like object type for representing fixture data.
 */
type JsonLike = Record<string, unknown>;

/**
 * Returns a list of keys to ignore when comparing fixture schemas.
 * These are properties that change frequently or are impractical to include
 * (making the diff file unreadable).
 *
 * @returns Array of dot-separated key paths to ignore
 */
const getFixtureIgnoredKeys = (): string[] => [
  // Permissions
  'data.PermissionController.subjectMetadata',
  'data.PermissionController.subjects',
  // Snap-related keys (source code)
  'data.SnapController.snaps',
  'data.SnapController.snapStates',
  'data.SnapController.unencryptedSnapStates',
  // Subject Metadata
  'data.SubjectMetadataController.subjectMetadata',
  // Locale-related keys
  'localeMessages',
  // Timestamps and dates that change on every run
  'data.AppStateController.newPrivacyPolicyToastShownDate',
  'data.AppStateController.onboardingDate',
  'data.AppStateController.recoveryPhraseReminderLastShown',
  'data.MetaMetricsController.tracesBeforeMetricsOptIn',
  'data.MetaMetricsController.traits.install_date_ext',
  // Environment-specific values that differ per machine
  'data.AppStateController.browserEnvironment.os',
];

/**
 * Removes duplicates from an array and sorts it alphabetically.
 *
 * @param values - Array of strings to deduplicate and sort
 * @returns Sorted array with unique values
 */
const sortUnique = (values: string[]): string[] =>
  Array.from(new Set(values)).sort();

/**
 * Validates that a value is a JSON object (not null, not an array).
 *
 * @param value - The value to validate
 * @param context - Description of the value for error messages
 * @returns The value cast as JsonLike
 * @throws Error if the value is not a valid JSON object
 */
const ensureJsonObject = (value: unknown, context: string): JsonLike => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${context} must be a JSON object`);
  }
  return value as JsonLike;
};

/**
 * Converts a JSON object to a type map for schema comparison.
 *
 * @param value - The JSON object to convert
 * @returns A map of dot-separated paths to their primitive types
 */
const toTypeMap = (value: JsonLike): StateLogsTypeMap => createTypeMap(value);

/**
 * Checks if a key should be ignored when comparing fixture schemas.
 *
 * @param key - The dot-separated key path to check
 * @returns True if the key should be ignored
 */
const shouldIgnoreFixtureKey = (key: string): boolean => {
  return shouldIgnoreKey(key, getFixtureIgnoredKeys());
};

/**
 * Reads and parses a JSON fixture file from disk.
 *
 * @param relativePath - Path to the fixture file (relative to cwd or absolute)
 * @returns The parsed JSON object
 * @throws Error if the file doesn't exist or isn't a valid JSON object
 */
export const readFixtureFile = async (
  relativePath: string,
): Promise<JsonLike> => {
  const filePath = path.isAbsolute(relativePath)
    ? relativePath
    : path.resolve(process.cwd(), relativePath);
  const contents = await fs.readJson(filePath);
  return ensureJsonObject(contents, `Fixture at ${filePath}`);
};

/**
 * Primitive types that should have their values compared (not just types).
 */
const VALUE_COMPARABLE_TYPES = ['string', 'number', 'boolean', 'null'];

/**
 * Formats a value for display in diff output.
 * Truncates long strings and handles special values.
 *
 * @param value - The value to format
 * @returns A string representation of the value
 */
const formatValueForDisplay = (value: unknown): string => {
  if (value === null) {
    return 'null';
  }
  if (typeof value === 'string') {
    return `"${truncate(value, { length: 50 })}"`;
  }
  return String(value);
};

/**
 * Computes the schema differences between a baseline fixture and a candidate state.
 * Identifies new keys, missing keys, type mismatches, and value mismatches.
 *
 * @param baseline - The existing baseline fixture to compare against
 * @param candidate - The new candidate state to compare
 * @returns An object containing arrays of new keys, missing keys, type mismatches, and value mismatches
 */
export const computeSchemaDiff = (
  baseline: JsonLike,
  candidate: JsonLike,
): FixtureSchemaDiff => {
  const baselineMap = toTypeMap(baseline);
  const candidateMap = toTypeMap(candidate);

  const newKeys = sortUnique(
    Object.keys(candidateMap)
      .filter((key) => !shouldIgnoreFixtureKey(key))
      .filter((key) => !(key in baselineMap)),
  );
  const missingKeys = sortUnique(
    Object.keys(baselineMap)
      .filter((key) => !shouldIgnoreFixtureKey(key))
      .filter((key) => !(key in candidateMap)),
  );
  const typeMismatches = sortUnique(
    Object.keys(candidateMap)
      .filter((key) => !shouldIgnoreFixtureKey(key))
      .filter((key) => key in baselineMap)
      .filter((key) => baselineMap[key] !== candidateMap[key])
      .map(
        (key) =>
          `${key} (expected ${baselineMap[key]}, received ${candidateMap[key]})`,
      ),
  );

  // Find value mismatches for primitive types (same type but different value)
  const valueMismatches = sortUnique(
    Object.keys(candidateMap)
      .filter((key) => !shouldIgnoreFixtureKey(key))
      .filter((key) => key in baselineMap)
      .filter((key) => baselineMap[key] === candidateMap[key]) // Same type
      .filter((key) => VALUE_COMPARABLE_TYPES.includes(candidateMap[key])) // Primitive type
      .filter((key) => {
        const baselineValue = get(baseline, key);
        const candidateValue = get(candidate, key);
        return !isEqual(baselineValue, candidateValue);
      })
      .map((key) => {
        const baselineValue = get(baseline, key);
        const candidateValue = get(candidate, key);
        return `${key} (${formatValueForDisplay(baselineValue)} → ${formatValueForDisplay(candidateValue)})`;
      }),
  );

  return { newKeys, missingKeys, typeMismatches, valueMismatches };
};

/**
 * Get the leaf key path from a type map key.
 * For regular keys like "data.Controller.property", returns the same path.
 * For array keys like "data.Controller.items[0].property", returns the path up to the array.
 *
 * @param keyPath - The key path from the type map
 * @returns The leaf key path to use for setting/deleting values
 */
const getLeafKeyPath = (keyPath: string): string => {
  // If the key contains array notation, we need to handle it specially
  // e.g., "data.Controller.items[0]" -> "data.Controller.items"
  const arrayMatch = keyPath.match(/^(.+?)\[\d+\]/u);
  if (arrayMatch) {
    return arrayMatch[1];
  }
  return keyPath;
};

/**
 * Merge changes from the new state into the existing fixture.
 * Only updates the specific keys that have actually changed (new, missing, or type mismatch),
 * preserving all other values including timestamps.
 *
 * @param existingFixture - The existing fixture to merge changes into
 * @param newState - The new state to merge from
 * @param schemaDiff - The schema diff containing new, missing, and mismatched keys
 * @returns The merged fixture
 */
export const mergeFixtureChanges = (
  existingFixture: JsonLike,
  newState: JsonLike,
  schemaDiff: FixtureSchemaDiff,
): JsonLike => {
  // Start with a deep clone of the existing fixture
  const merged = JSON.parse(JSON.stringify(existingFixture)) as JsonLike;
  const ignoredKeys = getFixtureIgnoredKeys();

  // Track which paths we've already processed to avoid duplicates
  const processedPaths = new Set<string>();

  // Add new keys - only set the specific property that was added
  for (const keyPath of schemaDiff.newKeys) {
    // Skip if this is an ignored key
    if (shouldIgnoreKey(keyPath, ignoredKeys)) {
      continue;
    }

    const leafPath = getLeafKeyPath(keyPath);

    // Skip if we've already processed this path
    if (processedPaths.has(leafPath)) {
      continue;
    }
    processedPaths.add(leafPath);

    // Get the value at the exact path from the new state
    const value = get(newState, leafPath);
    if (value !== undefined) {
      set(merged, leafPath, value);
    }
  }

  // Remove missing keys - only delete the specific property that was removed
  // Note: We intentionally do NOT clear processedPaths here. When an array has both
  // new and removed properties, both map to the same leafPath via getLeafKeyPath.
  // If we cleared processedPaths, we would delete the array we just set from newState.
  for (const keyPath of schemaDiff.missingKeys) {
    // Skip if this is an ignored key
    if (shouldIgnoreKey(keyPath, ignoredKeys)) {
      continue;
    }

    const leafPath = getLeafKeyPath(keyPath);

    // Skip if we've already processed this path
    if (processedPaths.has(leafPath)) {
      continue;
    }
    processedPaths.add(leafPath);

    // If the key path is the same as leafPath, it's a regular property (not array).
    // Otherwise, it's an array path that was transformed by getLeafKeyPath.
    if (leafPath === keyPath) {
      // Regular property (not array), just delete it
      unset(merged, leafPath);
    } else {
      // Array path: update the array from newState instead of deleting it entirely.
      // This handles the case where array items changed but the array still exists.
      const value = get(newState, leafPath);
      if (value === undefined) {
        // Array no longer exists in newState, delete it
        unset(merged, leafPath);
      } else {
        set(merged, leafPath, value);
      }
    }
  }

  // Update type mismatches - update only the specific property
  for (const mismatchEntry of schemaDiff.typeMismatches) {
    // Extract the key path from the mismatch entry (format: "key.path (expected X, received Y)")
    const keyPath = mismatchEntry.split(' (expected ')[0];

    // Skip if this is an ignored key
    if (shouldIgnoreKey(keyPath, ignoredKeys)) {
      continue;
    }

    const leafPath = getLeafKeyPath(keyPath);
    const value = get(newState, leafPath);
    if (value !== undefined) {
      set(merged, leafPath, value);
    }
  }

  // Update value mismatches - update primitive values that have changed
  for (const mismatchEntry of schemaDiff.valueMismatches) {
    // Extract the key path from the mismatch entry (format: "key.path (oldValue → newValue)")
    const keyPath = mismatchEntry.split(' (')[0];

    // Skip if this is an ignored key
    if (shouldIgnoreKey(keyPath, ignoredKeys)) {
      continue;
    }

    const leafPath = getLeafKeyPath(keyPath);

    // Skip if we've already processed this path (from newKeys, missingKeys, or typeMismatches)
    if (processedPaths.has(leafPath)) {
      continue;
    }
    processedPaths.add(leafPath);

    const value = get(newState, leafPath);
    if (value !== undefined) {
      set(merged, leafPath, value);
    }
  }

  return merged;
};

/**
 * Checks if a schema diff contains any differences.
 *
 * @param schemaDiff - The schema diff to check
 * @param schemaDiff.newKeys - Keys that exist in the new state but not in the baseline
 * @param schemaDiff.missingKeys - Keys that exist in the baseline but not in the new state
 * @param schemaDiff.typeMismatches - Keys with different types between baseline and new state
 * @param schemaDiff.valueMismatches - Keys with same type but different primitive values
 * @returns True if there are any new keys, missing keys, type mismatches, or value mismatches
 */
export const hasSchemaDifferences = ({
  newKeys,
  missingKeys,
  typeMismatches,
  valueMismatches,
}: FixtureSchemaDiff): boolean =>
  newKeys.length > 0 ||
  missingKeys.length > 0 ||
  typeMismatches.length > 0 ||
  valueMismatches.length > 0;

/**
 * Formats a schema diff into a human-readable string for display.
 * Groups differences by type (new, missing, type mismatch, value mismatch) and includes
 * instructions for updating the fixture.
 *
 * @param schemaDiff - The schema diff to format
 * @param schemaDiff.newKeys - Keys that exist in the new state but not in the baseline
 * @param schemaDiff.missingKeys - Keys that exist in the baseline but not in the new state
 * @param schemaDiff.typeMismatches - Keys with different types between baseline and new state
 * @param schemaDiff.valueMismatches - Keys with same type but different primitive values
 * @returns A formatted string describing the differences, or empty string if none
 */
export const formatSchemaDiff = ({
  newKeys,
  missingKeys,
  typeMismatches,
  valueMismatches,
}: FixtureSchemaDiff): string => {
  const messages: string[] = [];

  if (newKeys.length > 0) {
    messages.push(
      [
        'Detected new keys in wallet state fixture:',
        ...newKeys.map((key) => `  • ${key}`),
      ].join('\n'),
    );
  }

  if (missingKeys.length > 0) {
    messages.push(
      [
        'Detected missing keys compared to the existing fixture:',
        ...missingKeys.map((key) => `  • ${key}`),
      ].join('\n'),
    );
  }

  if (typeMismatches.length > 0) {
    messages.push(
      [
        'Detected keys with changed types compared to the existing fixture:',
        ...typeMismatches.map((entry) => `  • ${entry}`),
      ].join('\n'),
    );
  }

  if (valueMismatches.length > 0) {
    messages.push(
      [
        'Detected keys with changed values compared to the existing fixture:',
        ...valueMismatches.map((entry) => `  • ${entry}`),
      ].join('\n'),
    );
  }

  if (messages.length === 0) {
    return '';
  }

  messages.push(
    "\nUpdate the fixture locally and commit the change, or request an update by commenting '@metamaskbot update-e2e-fixture' on the pull request.",
  );

  return messages.join('\n\n');
};
