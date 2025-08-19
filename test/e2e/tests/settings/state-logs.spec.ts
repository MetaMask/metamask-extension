import { strict as assert } from 'assert';
import { promises as fs } from 'fs';
import { createDownloadFolder, withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import FixtureBuilder from '../../fixture-builder';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import AdvancedSettings from '../../page-objects/pages/settings/advanced-settings';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

const downloadsFolder = `${process.cwd()}/test-artifacts/downloads`;

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
  [key: string]: any;
};

// Function to get the type of a value
const getValueType = (value: any): string => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  return typeof value;
};

// Function to create a type-only version of an object (keys with their types)
const createTypeMap = (obj: any, path: string = ''): Record<string, string> => {
  const typeMap: Record<string, string> = {};

  for (const key in obj) {
    const currentPath = path ? `${path}.${key}` : key;
    const value = obj[key];
    const type = getValueType(value);

    typeMap[currentPath] = type;

    // Recursively process objects and arrays
    if (type === 'object' && value !== null) {
      Object.assign(typeMap, createTypeMap(value, currentPath));
    } else if (type === 'array' && value.length > 0) {
      // For arrays, we'll check the type of the first element as a sample
      const firstElementType = getValueType(value[0]);
      typeMap[`${currentPath}[0]`] = firstElementType;

      // If first element is an object, recursively process it
      if (firstElementType === 'object' && value[0] !== null) {
        Object.assign(typeMap, createTypeMap(value[0], `${currentPath}[0]`));
      }
    }
  }

  return typeMap;
};

// Function to compare type maps and find differences
const compareTypeMaps = (current: Record<string, string>, expected: Record<string, string>): string[] => {
  const differences: string[] = [];

  // Define keys to ignore during comparison
  const ignoredKeys = [
    'localeMessages',
    'metamask.snaps',
    'metamask.events',
    'metamask.subjects',
    'metamask.subjectMetadata',
    'metamask.isInitialized',
    'metamask.isUnlocked',
    'metamask.slides',
    'metamask.tokensChainsCache'
  ];

  // Helper function to check if a key should be ignored
  const shouldIgnoreKey = (key: string): boolean => {
    // Ignore array elements (keys ending with [number])
    if (key.match(/\[\d+\]$/)) {
      return true;
    }

    // Ignore entropy keys in account tree (dynamic entropy IDs)
    if (key.match(/entropy:[A-Z0-9]+/)) {
      return true;
    }

    // Ignore chain-specific keys in currentBlockGasLimitByChainId
    if (key.match(/metamask\.currentBlockGasLimitByChainId\.0x[a-fA-F0-9]+/)) {
      return true;
    }

    // Check if any part of the key path should be ignored
    const keyParts = key.split('.');
    return ignoredKeys.some(ignoredKey => {
      const ignoredParts = ignoredKey.split('.');
      // Check if the ignored key is a prefix of the current key OR if any part of the key path matches
      return ignoredParts.every((part, index) => keyParts[index] === part) ||
             keyParts.some(part => ignoredParts.includes(part));
    });
  };

  // Special validation for srpSessionData - validate structure but ignore specific session IDs
  const validateSrpSessionData = (current: Record<string, string>, expected: Record<string, string>): string[] => {
    const srpDifferences: string[] = [];

    // Find current srpSessionData keys
    const currentSrpKeys = Object.keys(current).filter(key => key.startsWith('metamask.srpSessionData.'));
    const expectedSrpKeys = Object.keys(expected).filter(key => key.startsWith('metamask.srpSessionData.'));

    if (currentSrpKeys.length === 0 && expectedSrpKeys.length > 0) {
      srpDifferences.push('Missing srpSessionData structure');
      return srpDifferences;
    }

    if (currentSrpKeys.length > 0 && expectedSrpKeys.length === 0) {
      srpDifferences.push('Unexpected srpSessionData structure found');
      return srpDifferences;
    }

    // For each current session, validate it has the expected nested structure
    for (const currentKey of currentSrpKeys) {
      // Extract the session ID from the current key
      const sessionId = currentKey.replace('metamask.srpSessionData.', '');

      // Get only the direct children of any expected session (not deeply nested)
      const expectedDirectChildren = expectedSrpKeys.filter(key => {
        const keyParts = key.split('.');
        return keyParts.length === 3 && keyParts[0] === 'metamask' && keyParts[1] === 'srpSessionData';
      });

      for (const expectedKey of expectedDirectChildren) {
        // Replace the expected session ID with the current session ID
        const expectedSessionId = expectedKey.split('.')[2];
        const actualKey = expectedKey.replace(`metamask.srpSessionData.${expectedSessionId}`, `metamask.srpSessionData.${sessionId}`);

        if (!(actualKey in current)) {
          srpDifferences.push(`Missing nested structure: ${actualKey}`);
        }
        // Don't check type mismatches for srpSessionData since the types might vary
      }
    }

    return srpDifferences;
  };

  // Check for missing keys in current
  for (const key in expected) {
    // Skip ignored keys and srpSessionData keys (handled separately)
    if (shouldIgnoreKey(key) || key.startsWith('metamask.srpSessionData.')) {
      continue;
    }

    if (!(key in current)) {
      differences.push(`Missing key: ${key}`);
    } else if (current[key] !== expected[key]) {
      differences.push(`Type mismatch at ${key}: expected ${expected[key]}, got ${current[key]}`);
    }
  }

  // Check for new keys in current
  for (const key in current) {
    // Skip ignored keys and srpSessionData keys (handled separately)
    if (shouldIgnoreKey(key) || key.startsWith('metamask.srpSessionData.')) {
      continue;
    }

    if (!(key in expected)) {
      differences.push(`New key found: ${key}`);
    }
  }

  // Add srpSessionData validation results
  differences.push(...validateSrpSessionData(current, expected));

  return differences;
};

const getStateLogsJson = async (): Promise<StateLogsJson | null> => {
  try {
    const stateLogs = `${downloadsFolder}/MetaMask state logs.json`;
    await fs.access(stateLogs);
    const contents = await fs.readFile(stateLogs);
    const parsedContents = JSON.parse(contents.toString());

    return parsedContents;
  } catch (e) {
    console.error('Error reading state logs:', e);
    return null;
  }
};

// Function to generate type-only JSON from current state logs
const generateTypeOnlyJson = (stateLogs: any): any => {
  const typeMap = createTypeMap(stateLogs);

  // For now, just return the flat type map as a simple object
  // This avoids the complex nested reconstruction that's causing errors
  const result: any = {};

  for (const path in typeMap) {
    result[path] = typeMap[path];
  }

  return result;
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
          throw new Error('State logs not found');
        }

        // Create type maps for comparison
        const currentTypeMap = createTypeMap(currentStateLogs);
        const expectedTypeMap = createTypeMap(require('./state-logs.json'));

        // Compare type maps
        const differences = compareTypeMaps(currentTypeMap, expectedTypeMap);

        if (differences.length > 0) {
          // Generate the new type-only JSON for easy updating
          const newTypeOnlyJson = generateTypeOnlyJson(currentStateLogs);

          // Write the new JSON to a file for easy access
          const outputPath = `${process.cwd()}/test-artifacts/new-state-logs-structure.json`;
          await fs.writeFile(outputPath, JSON.stringify(newTypeOnlyJson, null, 2));

          assert.fail(`State logs structure has changed. Found ${differences.length} differences:\n${differences.join('\n')}\n\nPlease update the state-original.json file with the new structure shown above or copy from: ${outputPath}`);
        }

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
      },
    );
  });
});
