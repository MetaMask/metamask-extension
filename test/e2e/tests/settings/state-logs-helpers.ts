import { Driver } from '../../webdriver/driver';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

export const colorize = (text: string, color: keyof typeof colors): string => {
  return `${colors[color]}${text}${colors.reset}`;
};

// Main comparison function - orchestrates all comparison types
export const compareTypeMaps = (
  current: Record<string, string>,
  expected: Record<string, string>,
): { colored: string[]; clean: string[] } => {
  console.log(colorize('🔍 Comparing state log structures...', 'cyan'));

  const ignoredKeys = getIgnoredKeys();
  const shouldIgnore = (key: string) => shouldIgnoreKey(key, ignoredKeys);

  const missingKeys = findMissingKeys(current, expected, shouldIgnore);
  const newKeys = findNewKeys(current, expected, shouldIgnore);
  const typeMismatches = findTypeMismatches(current, expected, shouldIgnore);
  const srpResults = validateSrpSessionData(current, expected);

  return combineResults([missingKeys, newKeys, typeMismatches, srpResults]);
};

const createCleanDifferenceMessage = (
  type: 'missing' | 'new' | 'mismatch' | 'empty_object',
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
    case 'empty_object':
      return `📦 Empty object key: ${key}`;
    default:
      return `Unknown difference: ${key}`;
  }
};

// Type definition for the specific fields we validate in state logs in the Account spec
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
  };
  [key: string]: unknown;
};

const getValueType = (value: unknown): string => {
  if (value === null) {
    return 'null';
  }
  if (Array.isArray(value)) {
    return 'array';
  }
  if (typeof value === 'object') {
    return 'object';
  }
  return typeof value;
};

export const createTypeMap = (
  obj: Record<string, unknown>,
  path = '',
): Record<string, string> => {
  const typeMap: Record<string, string> = {};

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

const isEmptyObjectKey = (
  key: string,
  typeMap: Record<string, string>,
): boolean => {
  return (
    typeMap[key] === 'object' &&
    !Object.keys(typeMap).some((k) => k.startsWith(`${key}.`))
  );
};

type Differences = {
  colored: string[];
  clean: string[];
};

const getIgnoredKeys = (): string[] => [
  'localeMessages',
  'metamask.slides',
  'metamask.currentBlockGasLimitByChainId',
  'metamask.networkConfigurationsByChainId',
];

const shouldIgnoreKey = (key: string, ignoredKeys: string[]): boolean => {
  if (key.match(/\[\d+\]$/u)) {
    return true;
  }

  // Ignore entropy keys in account tree (dynamic entropy IDs)
  if (key.match(/entropy:[A-Z0-9]+/u)) {
    return true;
  }

  // Check if any part of the key path should be ignored
  const keyParts = key.split('.');
  const shouldIgnore = ignoredKeys.some((ignoredKey) => {
    const ignoredParts = ignoredKey.split('.');

    // Ignore if the ignored key is an exact prefix of the current key
    // OR if the current key exactly matches the ignored key
    // OR if the current key starts with the ignored key (for nested properties)
    const isExactPrefix = ignoredParts.every(
      (part, index) => keyParts[index] === part,
    );
    const isExactMatch = key === ignoredKey;
    const startsWithIgnoredKey =
      key.startsWith(`${ignoredKey}.`) || key.startsWith(`${ignoredKey}[`);

    return isExactPrefix || isExactMatch || startsWithIgnoredKey;
  });

  return shouldIgnore;
};

const findMissingKeys = (
  current: Record<string, string>,
  expected: Record<string, string>,
  shouldIgnore: (key: string) => boolean,
): Differences => {
  const coloredDifferences: string[] = [];
  const cleanDifferences: string[] = [];

  for (const key in expected) {
    if (Object.prototype.hasOwnProperty.call(expected, key)) {
      // Skip ignored keys and srpSessionData keys (handled separately)
      if (shouldIgnore(key) || key.startsWith('metamask.srpSessionData.')) {
        continue;
      }

      if (!(key in current)) {
        coloredDifferences.push(colorize(`❌ Missing key: ${key}`, 'red'));
        cleanDifferences.push(createCleanDifferenceMessage('missing', key));
      }
    }
  }

  return { colored: coloredDifferences, clean: cleanDifferences };
};

const findNewKeys = (
  current: Record<string, string>,
  expected: Record<string, string>,
  shouldIgnore: (key: string) => boolean,
): Differences => {
  const coloredDifferences: string[] = [];
  const cleanDifferences: string[] = [];

  for (const key in current) {
    if (Object.prototype.hasOwnProperty.call(current, key)) {
      // Skip ignored keys and srpSessionData keys (handled separately)
      if (shouldIgnore(key) || key.startsWith('metamask.srpSessionData.')) {
        continue;
      }

      if (!(key in expected)) {
        coloredDifferences.push(colorize(`🆕 New key found: ${key}`, 'green'));
        cleanDifferences.push(createCleanDifferenceMessage('new', key));
      }
    }
  }

  return { colored: coloredDifferences, clean: cleanDifferences };
};

const findTypeMismatches = (
  current: Record<string, string>,
  expected: Record<string, string>,
  shouldIgnore: (key: string) => boolean,
): Differences => {
  const coloredDifferences: string[] = [];
  const cleanDifferences: string[] = [];

  for (const key in expected) {
    if (Object.prototype.hasOwnProperty.call(expected, key)) {
      // Skip ignored keys and srpSessionData keys (handled separately)
      if (shouldIgnore(key) || key.startsWith('metamask.srpSessionData.')) {
        continue;
      }

      if (key in current && current[key] !== expected[key]) {
        const isCurrentEmpty = isEmptyObjectKey(key, current);
        const isExpectedEmpty = isEmptyObjectKey(key, expected);

        if (isCurrentEmpty || isExpectedEmpty) {
          let emptyIndicator: string;
          if (isCurrentEmpty && isExpectedEmpty) {
            emptyIndicator = 'both empty';
          } else if (isCurrentEmpty) {
            emptyIndicator = 'current empty';
          } else {
            emptyIndicator = 'expected empty';
          }

          coloredDifferences.push(
            colorize(
              `📦 Empty object difference at ${key}: ${emptyIndicator}`,
              'yellow',
            ),
          );
          cleanDifferences.push(
            createCleanDifferenceMessage('empty_object', key),
          );
        } else {
          coloredDifferences.push(
            colorize(
              `🔄 Type mismatch at ${key}: expected ${colorize(expected[key], 'yellow')}, got ${colorize(current[key], 'blue')}`,
              'magenta',
            ),
          );
          cleanDifferences.push(
            createCleanDifferenceMessage(
              'mismatch',
              key,
              expected[key],
              current[key],
            ),
          );
        }
      }
    }
  }

  return { colored: coloredDifferences, clean: cleanDifferences };
};

// Special validation for srpSessionData - validate structure but ignore specific session IDs as they change
const validateSrpSessionData = (
  current: Record<string, string>,
  expected: Record<string, string>,
): Differences => {
  const coloredSrpDifferences: string[] = [];
  const cleanSrpDifferences: string[] = [];

  const currentSrpKeys = Object.keys(current).filter((key) =>
    key.startsWith('metamask.srpSessionData.'),
  );
  const expectedSrpKeys = Object.keys(expected).filter((key) =>
    key.startsWith('metamask.srpSessionData.'),
  );

  // If expected has srpSessionData but current doesn't, that's okay - it might be empty
  if (currentSrpKeys.length === 0 && expectedSrpKeys.length > 0) {
    return { colored: coloredSrpDifferences, clean: cleanSrpDifferences };
  }

  if (currentSrpKeys.length > 0 && expectedSrpKeys.length === 0) {
    coloredSrpDifferences.push(
      colorize('❌ Unexpected srpSessionData structure found', 'red'),
    );
    cleanSrpDifferences.push('❌ Unexpected srpSessionData structure found');
    return { colored: coloredSrpDifferences, clean: cleanSrpDifferences };
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
        coloredSrpDifferences.push(
          colorize(`❌ No expected SRP session structure found`, 'red'),
        );
        cleanSrpDifferences.push(`❌ No expected SRP session structure found`);
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
            coloredSrpDifferences.push(
              colorize(`❌ Missing SRP key: ${mappedKey}`, 'red'),
            );
            cleanSrpDifferences.push(`❌ Missing SRP key: ${mappedKey}`);
          } else if (current[mappedKey] !== expected[refKey]) {
            coloredSrpDifferences.push(
              colorize(
                `🔄 SRP type mismatch at ${mappedKey}: expected ${colorize(expected[refKey], 'yellow')}, got ${colorize(current[mappedKey], 'blue')}`,
                'magenta',
              ),
            );
            cleanSrpDifferences.push(
              createCleanDifferenceMessage(
                'mismatch',
                mappedKey,
                expected[refKey],
                current[mappedKey],
              ),
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
          coloredSrpDifferences.push(
            colorize(`🆕 New SRP key found: ${currentKey}`, 'green'),
          );
          cleanSrpDifferences.push(
            createCleanDifferenceMessage('new', currentKey),
          );
        }
      }
    }
  }

  return { colored: coloredSrpDifferences, clean: cleanSrpDifferences };
};

const combineResults = (results: Differences[]): Differences => {
  const combinedColored: string[] = [];
  const combinedClean: string[] = [];

  results.forEach((result) => {
    combinedColored.push(...result.colored);
    combinedClean.push(...result.clean);
  });

  return { colored: combinedColored, clean: combinedClean };
};

const readStateLogsFile = async (
  downloadsFolder: string,
): Promise<MinimalStateLogsJson | null> => {
  try {
    const stateLogs = `${downloadsFolder}/MetaMask state logs.json`;
    const { promises: fs } = await import('fs');
    const contents = await fs.readFile(stateLogs);
    const parsedContents = JSON.parse(contents.toString());
    return parsedContents;
  } catch (e) {
    return null;
  }
};

export const getDownloadedStateLogs = async (
  driver: Driver,
  downloadsFolder: string,
): Promise<MinimalStateLogsJson> => {
  console.log('Verifying downloaded state logs');

  let currentStateLogs: MinimalStateLogsJson | null = null;
  await driver.wait(async () => {
    currentStateLogs = await readStateLogsFile(downloadsFolder);
    return currentStateLogs !== null;
  }, 10000);

  if (currentStateLogs === null) {
    throw new Error(colorize('❌ State logs not found', 'red'));
  }

  console.log(colorize('✅ State logs downloaded successfully', 'green'));
  return currentStateLogs;
};
