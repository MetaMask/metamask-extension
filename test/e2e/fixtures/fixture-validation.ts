import path from 'path';
import fs from 'fs-extra';
import {
  createTypeMap,
  shouldIgnoreKey,
  type StateLogsTypeMap,
} from '../tests/settings/state-logs-helpers';

export type FixtureSchemaDiff = {
  newKeys: string[];
  missingKeys: string[];
  typeMismatches: string[];
};

type JsonLike = Record<string, unknown>;

// These are properties that change frequently or are impractical to include in (making the diff file unreadable)
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
];

const sortUnique = (values: string[]): string[] =>
  Array.from(new Set(values)).sort();

const ensureJsonObject = (value: unknown, context: string): JsonLike => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${context} must be a JSON object`);
  }
  return value as JsonLike;
};

const toTypeMap = (value: JsonLike): StateLogsTypeMap => createTypeMap(value);

const shouldIgnoreFixtureKey = (key: string): boolean => {
  return shouldIgnoreKey(key, getFixtureIgnoredKeys());
};

export const readFixtureFile = async (
  relativePath: string,
): Promise<JsonLike> => {
  const filePath = path.isAbsolute(relativePath)
    ? relativePath
    : path.resolve(process.cwd(), relativePath);
  const contents = await fs.readJson(filePath);
  return ensureJsonObject(contents, `Fixture at ${filePath}`);
};

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

  return { newKeys, missingKeys, typeMismatches };
};

export { getFixtureIgnoredKeys };

/**
 * Get a nested value from an object using a dot-separated path
 *
 * @param obj - The object to get the value from
 * @param keyPath - The dot-separated path to the value
 * @returns The value at the path, or undefined if not found
 */
const getNestedValue = (obj: JsonLike, keyPath: string): unknown => {
  const parts = keyPath.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (typeof current !== 'object') {
      return undefined;
    }
    current = (current as JsonLike)[part];
  }

  return current;
};

/**
 * Set a nested value in an object using a dot-separated path
 *
 * @param obj - The object to set the value in
 * @param keyPath - The dot-separated path to the value
 * @param value - The value to set
 */
const setNestedValue = (
  obj: JsonLike,
  keyPath: string,
  value: unknown,
): void => {
  const parts = keyPath.split('.');
  let current: JsonLike = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (
      !(part in current) ||
      typeof current[part] !== 'object' ||
      current[part] === null
    ) {
      current[part] = {};
    }
    current = current[part] as JsonLike;
  }

  current[parts[parts.length - 1]] = value;
};

/**
 * Delete a nested value from an object using a dot-separated path
 *
 * @param obj - The object to delete the value from
 * @param keyPath - The dot-separated path to the value
 */
const deleteNestedValue = (obj: JsonLike, keyPath: string): void => {
  const parts = keyPath.split('.');
  let current: JsonLike = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (
      !(part in current) ||
      typeof current[part] !== 'object' ||
      current[part] === null
    ) {
      return; // Path doesn't exist, nothing to delete
    }
    current = current[part] as JsonLike;
  }

  delete current[parts[parts.length - 1]];
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
    const value = getNestedValue(newState, leafPath);
    if (value !== undefined) {
      setNestedValue(merged, leafPath, value);
    }
  }

  // Remove missing keys - only delete the specific property that was removed
  processedPaths.clear();
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

    // Delete the specific property
    deleteNestedValue(merged, leafPath);
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
    const value = getNestedValue(newState, leafPath);
    if (value !== undefined) {
      setNestedValue(merged, leafPath, value);
    }
  }

  return merged;
};

export const hasSchemaDifferences = ({
  newKeys,
  missingKeys,
  typeMismatches,
}: FixtureSchemaDiff): boolean =>
  newKeys.length > 0 || missingKeys.length > 0 || typeMismatches.length > 0;

export const formatSchemaDiff = ({
  newKeys,
  missingKeys,
  typeMismatches,
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

  if (messages.length === 0) {
    return '';
  }

  messages.push(
    "\nUpdate the fixture locally and commit the change, or request an update by commenting '@metamaskbot update-e2e-fixture' on the pull request.",
  );

  return messages.join('\n\n');
};
