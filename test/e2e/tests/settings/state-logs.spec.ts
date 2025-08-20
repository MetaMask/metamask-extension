import { strict as assert } from 'assert';
import { promises as fs } from 'fs';
import { createDownloadFolder, withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import FixtureBuilder from '../../fixture-builder';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import AdvancedSettings from '../../page-objects/pages/settings/advanced-settings';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import referenceStateLogs from './state-logs.json';

const downloadsFolder = `${process.cwd()}/test-artifacts/downloads`;

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

const colorize = (text: string, color: keyof typeof colors): string => {
  return `${colors[color]}${text}${colors.reset}`;
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

type StateLogsJson = {
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

const createTypeMap = (
  obj: Record<string, unknown>,
  path = '',
): Record<string, string> => {
  const typeMap: Record<string, string> = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const currentPath = path ? `${path}.${key}` : key;
      const value = obj[key];
      const type = getValueType(value);

      // Always set the type for this key
      typeMap[currentPath] = type;

      if (type === 'object' && value !== null) {
        // If the object has properties, recursively process them
        const objectKeys = Object.keys(value as Record<string, unknown>);
        if (objectKeys.length > 0) {
          Object.assign(
            typeMap,
            createTypeMap(value as Record<string, unknown>, currentPath),
          );
        }
        // Note: Empty objects will still have their type recorded as 'object'
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

// Helper function to check if a key represents an empty object
const isEmptyObjectKey = (
  key: string,
  typeMap: Record<string, string>,
): boolean => {
  return (
    typeMap[key] === 'object' &&
    !Object.keys(typeMap).some((k) => k.startsWith(`${key}.`))
  );
};

const compareTypeMaps = (
  current: Record<string, string>,
  expected: Record<string, string>,
): { colored: string[]; clean: string[] } => {
  const coloredDifferences: string[] = [];
  const cleanDifferences: string[] = [];
  console.log(colorize('🔍 Comparing state log structures...', 'cyan'));

  // To avoid updates on the state logs file, with low risk changes
  const ignoredKeys = ['localeMessages', 'metamask.slides'];

  const shouldIgnoreKey = (key: string): boolean => {
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

  // Special validation for srpSessionData - validate structure but ignore specific session IDs
  const validateSrpSessionData = (
    currentSrp: Record<string, string>,
    expectedSrp: Record<string, string>,
  ): { colored: string[]; clean: string[] } => {
    const coloredSrpDifferences: string[] = [];
    const cleanSrpDifferences: string[] = [];

    // Find current srpSessionData keys
    const currentSrpKeys = Object.keys(currentSrp).filter((key) =>
      key.startsWith('metamask.srpSessionData.'),
    );
    const expectedSrpKeys = Object.keys(expectedSrp).filter((key) =>
      key.startsWith('metamask.srpSessionData.'),
    );

    // If expected has srpSessionData but current doesn't, that's okay - it might be empty
    if (currentSrpKeys.length === 0 && expectedSrpKeys.length > 0) {
      // Don't report this as an error - srpSessionData might be empty in current state
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
          cleanSrpDifferences.push(
            `❌ No expected SRP session structure found`,
          );
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
            if (!(mappedKey in currentSrp)) {
              coloredSrpDifferences.push(
                colorize(`❌ Missing SRP key: ${mappedKey}`, 'red'),
              );
              cleanSrpDifferences.push(`❌ Missing SRP key: ${mappedKey}`);
            } else if (currentSrp[mappedKey] !== expectedSrp[refKey]) {
              coloredSrpDifferences.push(
                colorize(
                  `🔄 SRP type mismatch at ${mappedKey}: expected ${colorize(expectedSrp[refKey], 'yellow')}, got ${colorize(currentSrp[mappedKey], 'blue')}`,
                  'magenta',
                ),
              );
              cleanSrpDifferences.push(
                createCleanDifferenceMessage(
                  'mismatch',
                  mappedKey,
                  expectedSrp[refKey],
                  currentSrp[mappedKey],
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
          if (!(expectedKey in expectedSrp)) {
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

  // Check for missing keys in current
  for (const key in expected) {
    if (Object.prototype.hasOwnProperty.call(expected, key)) {
      // Skip ignored keys and srpSessionData keys (handled separately)
      if (shouldIgnoreKey(key) || key.startsWith('metamask.srpSessionData.')) {
        continue;
      }

      if (!(key in current)) {
        coloredDifferences.push(colorize(`❌ Missing key: ${key}`, 'red'));
        cleanDifferences.push(createCleanDifferenceMessage('missing', key));
      } else if (current[key] !== expected[key]) {
        // Check if this is an empty object difference
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

  // Check for new keys in current
  for (const key in current) {
    if (Object.prototype.hasOwnProperty.call(current, key)) {
      // Skip ignored keys and srpSessionData keys (handled separately)
      if (shouldIgnoreKey(key) || key.startsWith('metamask.srpSessionData.')) {
        continue;
      }

      if (!(key in expected)) {
        coloredDifferences.push(colorize(`🆕 New key found: ${key}`, 'green'));
        cleanDifferences.push(createCleanDifferenceMessage('new', key));
      }
    }
  }

  // Add srpSessionData validation results
  const srpResults = validateSrpSessionData(current, expected);
  coloredDifferences.push(...srpResults.colored);
  cleanDifferences.push(...srpResults.clean);

  return { colored: coloredDifferences, clean: cleanDifferences };
};

const getStateLogsJson = async (): Promise<StateLogsJson | null> => {
  try {
    const stateLogs = `${downloadsFolder}/MetaMask state logs.json`;
    const contents = await fs.readFile(stateLogs);
    const parsedContents = JSON.parse(contents.toString());

    return parsedContents;
  } catch (e) {
    console.error('Error reading state logs:', e);
    return null;
  }
};

describe('State logs', function () {
  it('should download state logs for the account and match expected structure', async function () {
    if (process.env.SELENIUM_BROWSER === 'chrome') {
      // Chrome shows OS level download prompt which can't be dismissed by Selenium
      this.skip();
    }
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await createDownloadFolder(downloadsFolder);
        await loginWithBalanceValidation(driver);

        // Download state logs
        await new HeaderNavbar(driver).openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.checkPageIsLoaded();
        await settingsPage.clickAdvancedTab();
        const advancedSettingsPage = new AdvancedSettings(driver);
        await advancedSettingsPage.checkPageIsLoaded();
        await advancedSettingsPage.downloadStateLogs();

        // Verify download
        let currentStateLogs: StateLogsJson | null = null;
        await driver.wait(async () => {
          currentStateLogs = await getStateLogsJson();
          return currentStateLogs !== null;
        }, 10000);

        if (currentStateLogs === null) {
          throw new Error(colorize('❌ State logs not found', 'red'));
        }

        console.log(colorize('✅ State logs downloaded successfully', 'green'));

        // Create type maps for comparison
        const currentTypeMap = createTypeMap(currentStateLogs);
        const expectedTypeMap = createTypeMap(referenceStateLogs);

        console.log(colorize('📋 Created type maps for comparison', 'cyan'));

        // Compare type maps
        const { colored, clean } = compareTypeMaps(
          currentTypeMap,
          expectedTypeMap,
        );

        if (colored.length > 0) {
          // The state logs are already downloaded to the downloads folder
          const downloadedStateLogsPath = `${downloadsFolder}/MetaMask state logs.json`;

          console.log(
            colorize(`\n📊 State logs structure comparison results:`, 'bright'),
          );
          console.log(
            colorize(`Found ${colored.length} differences:`, 'yellow'),
          );
          console.log(colorize('='.repeat(60), 'cyan'));

          colored.forEach((diff, index) => {
            console.log(`${colorize(`${index + 1}.`, 'blue')} ${diff}`);
          });

          console.log(colorize('='.repeat(60), 'cyan'));
          console.log(
            colorize(
              `📝 Please update the state-logs.json file. You can copy it from ${downloadedStateLogsPath}`,
              'yellow',
            ),
          );

          assert.fail(
            `State logs structure has changed. Found ${colored.length} differences:\n${clean.join('\n')}\n\nPlease update the state-logs.json file with the new structure from: ${downloadedStateLogsPath}`,
          );
        }

        console.log(
          colorize('✅ State logs structure validation passed!', 'green'),
        );

        // Additional specific assertions for critical fields (type checking)
        const stateLogs = currentStateLogs as StateLogsJson;
        assert.equal(
          typeof stateLogs.metamask.identities[
            '0x5cfe73b6021e818b776b421b1c4db2474086a7e1'
          ].address,
          'string',
        );
        assert.equal(
          typeof stateLogs.metamask.internalAccounts.accounts[
            stateLogs.metamask.internalAccounts.selectedAccount
          ].address,
          'string',
        );

        console.log(
          colorize('✅ Critical field type validation passed!', 'green'),
        );
      },
    );
  });
});
