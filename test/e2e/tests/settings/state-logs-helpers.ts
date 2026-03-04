import { join } from 'path';
import { Driver } from '../../webdriver/driver';
import { shouldIgnoreKey } from '../../helpers';

export type StateLogsPrimitiveType =
  | 'array'
  | 'boolean'
  | 'bigint'
  | 'null'
  | 'number'
  | 'object'
  | 'string'
  | 'undefined';

export type StateLogsTypeMap = Record<string, StateLogsPrimitiveType>;

export type StateLogsTypeDescriptor =
  | StateLogsPrimitiveType
  | StateLogsTypeDescriptorObject
  | StateLogsTypeDescriptorArray;

export type StateLogsTypeDescriptorObject = {
  [key: string]: StateLogsTypeDescriptor;
};

export type StateLogsTypeDescriptorArray = StateLogsTypeDescriptor[];

export type StateLogsTypeDefinition = Record<string, StateLogsTypeDescriptor>;

type Differences = {
  differences: string[];
};

const createDifferenceMessage = (
  type: 'missing' | 'new' | 'mismatch',
  key: string,
  expectedType?: string,
  actualType?: string,
): string => {
  switch (type) {
    case 'missing':
      return `❌ Missing key: ${key}`;
    case 'new':
      return `🆕 New key found: ${key}`;
    case 'mismatch':
      return `🔄 Type mismatch at ${key}: expected ${expectedType}, got ${actualType}`;
    default:
      return `Unknown difference: ${key}`;
  }
};

// Minimal type definition for the specific fields we validate in the State Logs Account spec
type MinimalStateLogsJson = {
  metamask: {
    identities: {
      [key: string]: {
        address: string;
      };
    };
    internalAccounts: {
      selectedAccount: string;
      accounts: {
        [key: string]: {
          address: string;
        };
      };
    };
    syncQueue: {
      [key: string]: [
        {
          address: string;
          scopes: [];
        },
      ];
    };
  };
  [key: string]: unknown;
};

const getValueType = (value: unknown): StateLogsPrimitiveType => {
  if (value === null) {
    return 'null';
  }
  if (Array.isArray(value)) {
    return 'array';
  }
  if (typeof value === 'object') {
    return 'object';
  }
  const valueType = typeof value;
  switch (valueType) {
    case 'boolean':
    case 'number':
    case 'string':
    case 'undefined':
      return valueType;
    case 'bigint':
      return 'bigint';
    default:
      return 'object';
  }
};

// Function to create a type-only version of an object (keys with their types)
export const createTypeMap = (
  obj: Record<string, unknown>,
  path = '',
): StateLogsTypeMap => {
  const typeMap: StateLogsTypeMap = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const currentPath = path ? `${path}.${key}` : key;
      const value = obj[key];
      const type = getValueType(value);

      typeMap[currentPath] = type;

      if (type === 'object' && value !== null) {
        const objectKeys = Object.keys(value as Record<string, unknown>);
        if (objectKeys.length > 0) {
          Object.assign(
            typeMap,
            createTypeMap(value as Record<string, unknown>, currentPath),
          );
        }
        // Empty objects will still have their type recorded as 'object'
      } else if (type === 'array' && Array.isArray(value) && value.length > 0) {
        // For arrays, we'll check the type of the first element as a sample
        const firstElementType = getValueType(value[0]);
        typeMap[`${currentPath}[0]`] = firstElementType;

        // If first element is an object, recursively process it
        if (firstElementType === 'object' && value[0] !== null) {
          Object.assign(
            typeMap,
            createTypeMap(
              value[0] as Record<string, unknown>,
              `${currentPath}[0]`,
            ),
          );
        }
      }
    }
  }

  return typeMap;
};

/** Path segment used in type map for wildcard (any key at this level). */
const WILDCARD_SEGMENT = '*';

const isWildcardKey = (key: string): boolean =>
  key.split('.').some((segment) => segment === WILDCARD_SEGMENT);

/**
 * Returns true if a current (actual) key matches an expected key that may contain
 * wildcard segments ("*" = any single path segment). Supports any number of
 * wildcards at any level, e.g. metamask.foo.* or metamask.foo.*.bar.*.baz.
 *
 * @param currentKey - Flattened path from actual state (e.g. metamask.foo.0x1.bar.0x2.baz)
 * @param expectedKey - Flattened path from definition (e.g. metamask.foo.*.bar.*.baz)
 * @returns true when path lengths match and each segment equals or is wildcard
 */
const currentKeyMatchesExpectedWildcard = (
  currentKey: string,
  expectedKey: string,
): boolean => {
  const currentParts = currentKey.split('.');
  const expectedParts = expectedKey.split('.');
  if (currentParts.length !== expectedParts.length) {
    return false;
  }
  return expectedParts.every(
    (expectedPart, i) =>
      expectedPart === WILDCARD_SEGMENT || expectedPart === currentParts[i],
  );
};

const flattenTypeDescriptor = (
  descriptor: StateLogsTypeDescriptor,
  path: string,
  typeMap: StateLogsTypeMap,
): void => {
  if (typeof descriptor === 'string') {
    typeMap[path] = descriptor;
    return;
  }

  if (Array.isArray(descriptor)) {
    typeMap[path] = 'array';
    if (descriptor.length > 0) {
      flattenTypeDescriptor(descriptor[0], `${path}[0]`, typeMap);
    }
    return;
  }

  typeMap[path] = 'object';
  for (const [key, value] of Object.entries(descriptor)) {
    const nextPath = path ? `${path}.${key}` : key;
    flattenTypeDescriptor(value, nextPath, typeMap);
  }
};

export const createTypeMapFromDefinition = (
  definition: StateLogsTypeDefinition,
): StateLogsTypeMap => {
  const typeMap: StateLogsTypeMap = {};
  for (const [key, value] of Object.entries(definition)) {
    flattenTypeDescriptor(value, key, typeMap);
  }
  return typeMap;
};

// We can ignore keys for 2 reasons:
// 1. To avoid failing for frequent state changes, which are low risk
// 2. To mitigate flakiness for properties which appear intermittently on state, right after login in
// 3. To handle properties that depend on browser environment (e.g., appActiveTab requires active tabs)
//    Firefox doesn't support sidepanel and tabs may not be available at startup in E2E tests
const getIgnoredKeys = (): string[] => [
  'localeMessages',
  'metamask.currentBlockGasLimitByChainId',
  'metamask.database.verifiedSnaps',
  'metamask.domains',
  'metamask.networkConfigurationsByChainId',
  'metamask.slides',
  'metamask.snaps',
  'metamask.subjects',
  'metamask.verifiedSnaps',
  'metamask.networksMetadata',
  'metamask.appActiveTab', // Firefox doesn't support sidepanel and tabs may not be available at startup in E2E tests
];

const findMissingKeys = (
  current: StateLogsTypeMap,
  expected: StateLogsTypeMap,
  shouldIgnore: (key: string) => boolean,
): Differences => {
  const differences: string[] = [];

  for (const key in expected) {
    if (Object.prototype.hasOwnProperty.call(expected, key)) {
      // Skip ignored keys and srpSessionData keys (handled separately)
      if (shouldIgnore(key) || key.startsWith('metamask.srpSessionData.')) {
        continue;
      }
      // Wildcard keys (e.g. metamask.thresholdCache.*) define "any key here"; no literal key is required
      if (isWildcardKey(key)) {
        continue;
      }

      if (!(key in current)) {
        differences.push(createDifferenceMessage('missing', key));
      }
    }
  }

  return { differences };
};

const findNewKeys = (
  current: StateLogsTypeMap,
  expected: StateLogsTypeMap,
  shouldIgnore: (key: string) => boolean,
): Differences => {
  const differences: string[] = [];

  for (const key in current) {
    if (Object.prototype.hasOwnProperty.call(current, key)) {
      // Skip ignored keys and srpSessionData keys (handled separately)
      if (shouldIgnore(key) || key.startsWith('metamask.srpSessionData.')) {
        continue;
      }

      const inExpectedLiteral = key in expected;
      const matchedByWildcard = Object.keys(expected).some((expectedKey) =>
        currentKeyMatchesExpectedWildcard(key, expectedKey),
      );
      if (!inExpectedLiteral && !matchedByWildcard) {
        differences.push(createDifferenceMessage('new', key));
      }
    }
  }

  return { differences };
};

const findTypeMismatches = (
  current: StateLogsTypeMap,
  expected: StateLogsTypeMap,
  shouldIgnore: (key: string) => boolean,
): Differences => {
  const differences: string[] = [];

  for (const key in expected) {
    if (Object.prototype.hasOwnProperty.call(expected, key)) {
      // Skip ignored keys and srpSessionData keys (handled separately)
      if (shouldIgnore(key) || key.startsWith('metamask.srpSessionData.')) {
        continue;
      }

      let wildcardCurrentKey: string | undefined;
      if (isWildcardKey(key)) {
        wildcardCurrentKey = Object.keys(current).find((currentKey) =>
          currentKeyMatchesExpectedWildcard(currentKey, key),
        );
      }

      const currentKey = wildcardCurrentKey ?? key;
      if (currentKey in current && current[currentKey] !== expected[key]) {
        differences.push(
          createDifferenceMessage(
            'mismatch',
            key,
            expected[key],
            current[currentKey],
          ),
        );
      }
    }
  }

  return { differences };
};

// Special validation for srpSessionData because session IDs are dynamic
const validateSrpSessionData = (
  current: StateLogsTypeMap,
  expected: StateLogsTypeMap,
): Differences => {
  const differences: string[] = [];

  const currentSrpKeys = Object.keys(current).filter((key) =>
    key.startsWith('metamask.srpSessionData.'),
  );
  const expectedSrpKeys = Object.keys(expected).filter((key) =>
    key.startsWith('metamask.srpSessionData.'),
  );

  // If expected has srpSessionData but current doesn't, that's okay - it might be empty
  if (currentSrpKeys.length === 0 && expectedSrpKeys.length > 0) {
    return { differences };
  }

  if (currentSrpKeys.length > 0 && expectedSrpKeys.length === 0) {
    differences.push('❌ Unexpected srpSessionData structure found');
    return { differences };
  }

  // Group keys by session ID to validate structure
  const groupKeysBySession = (keys: string[]) => {
    const grouped: Record<string, string[]> = {};
    keys.forEach((key) => {
      const parts = key.split('.');
      if (parts.length >= 3) {
        const sessionId = parts[2];
        if (!grouped[sessionId]) {
          grouped[sessionId] = [];
        }
        grouped[sessionId].push(key);
      }
    });
    return grouped;
  };

  const currentSessions = groupKeysBySession(currentSrpKeys);
  const expectedSessions = groupKeysBySession(expectedSrpKeys);

  // For each current session, validate it has the expected structure
  for (const currentSessionId in currentSessions) {
    if (
      Object.prototype.hasOwnProperty.call(currentSessions, currentSessionId)
    ) {
      const currentSessionKeys = currentSessions[currentSessionId];

      // Find a reference expected session (use the first one)
      const expectedSessionIds = Object.keys(expectedSessions);
      if (expectedSessionIds.length === 0) {
        differences.push('❌ No expected SRP session structure found');
        continue;
      }

      const referenceSessionId = expectedSessionIds[0];
      const referenceSessionKeys = expectedSessions[referenceSessionId];

      // Create a mapping from reference session keys to current session keys
      const keyMapping: Record<string, string> = {};
      referenceSessionKeys.forEach((refKey) => {
        const mappedKey = refKey.replace(
          `metamask.srpSessionData.${referenceSessionId}`,
          `metamask.srpSessionData.${currentSessionId}`,
        );
        keyMapping[refKey] = mappedKey;
      });

      // Check for missing keys in current session
      for (const refKey in keyMapping) {
        if (Object.prototype.hasOwnProperty.call(keyMapping, refKey)) {
          const mappedKey = keyMapping[refKey];
          if (!(mappedKey in current)) {
            differences.push(`❌ Missing SRP key: ${mappedKey}`);
          } else if (current[mappedKey] !== expected[refKey]) {
            differences.push(
              `🔄 SRP type mismatch at ${mappedKey}: expected ${expected[refKey]}, got ${current[mappedKey]}`,
            );
          }
        }
      }

      // Check for extra keys in current session
      for (const currentKey of currentSessionKeys) {
        const expectedKey = currentKey.replace(
          `metamask.srpSessionData.${currentSessionId}`,
          `metamask.srpSessionData.${referenceSessionId}`,
        );
        if (!(expectedKey in expected)) {
          differences.push(`🆕 New SRP key found: ${currentKey}`);
        }
      }
    }
  }

  return { differences };
};

const combineResults = (results: Differences[]): Differences => {
  const combinedDifferences: string[] = [];

  results.forEach((result) => {
    combinedDifferences.push(...result.differences);
  });

  return { differences: combinedDifferences };
};

// Main comparison function - orchestrates all comparison types
export const compareTypeMaps = (
  current: StateLogsTypeMap,
  expected: StateLogsTypeMap,
): { differences: string[] } => {
  console.log('🔍 Comparing state log structures...');

  const ignoredKeys = getIgnoredKeys();
  const shouldIgnore = (key: string) => shouldIgnoreKey(key, ignoredKeys);

  const missingKeys = findMissingKeys(current, expected, shouldIgnore);
  const newKeys = findNewKeys(current, expected, shouldIgnore);
  const typeMismatches = findTypeMismatches(current, expected, shouldIgnore);
  const srpResults = validateSrpSessionData(current, expected);

  return combineResults([missingKeys, newKeys, typeMismatches, srpResults]);
};

// Low-level: Read file from disk
const readStateLogsFile = async (
  downloadsFolder: string,
): Promise<MinimalStateLogsJson | null> => {
  try {
    const stateLogs = join(downloadsFolder, 'MetaMask state logs.json');
    const { promises: fs } = await import('fs');
    const contents = await fs.readFile(stateLogs);
    const parsedContents = JSON.parse(contents.toString());
    return parsedContents;
  } catch (e) {
    return null;
  }
};

// High-level: Test helper with verification
export const getDownloadedStateLogs = async (
  driver: Driver,
  downloadsFolder: string,
): Promise<MinimalStateLogsJson> => {
  console.log('Verifying downloaded state logs');

  let stateLogs: MinimalStateLogsJson | null = null;
  await driver.wait(async () => {
    stateLogs = await readStateLogsFile(downloadsFolder);
    return stateLogs !== null;
  }, 10000);

  if (stateLogs === null) {
    throw new Error('❌ State logs not found');
  }

  console.log('✅ State logs downloaded successfully');
  return stateLogs;
};
