import { Page } from '@playwright/test';
import { ChromeExtensionPage } from '../pageObjects/extension-page';
import { loginWithBalanceValidation } from '../flows/login.flow';
import FixtureBuilder from '../../../fixture-builder';
import { Anvil } from '../../../seeder/anvil';
import { setManifestFlags } from '../../../set-manifest-flags';
import fs from 'fs';
import path from 'path';

// Import CommonJS modules
const mockttp = require('mockttp');
const FixtureServer = require('../../../fixture-server');
const { setupMocking } = require('../../../mock-e2e');

export interface PlaywrightFixtureOptions {
  fixtures?: any;
  title?: string;
  driverOptions?: {
    timeOut?: number;
  };
  localNodeOptions?: string | object;
  testSpecificMock?: (mockServer: any) => Promise<void>;
  manifestFlags?: any;
}

export interface PlaywrightTestArguments {
  page: Page;
  localNode?: Anvil;
  mockedEndpoint?: any;
  mockServer?: any;
}

// Helper functions for manifest backup/restore (same as Selenium)
function getManifestFolder(): string {
  const browser = process.env.SELENIUM_BROWSER || 'chrome';
  return path.join(process.cwd(), 'dist', browser);
}

function backupManifest(extension = 'backup') {
  const folder = getManifestFolder();
  const source = `${folder}/manifest.json`;
  const target = `${folder}/manifest.${extension}.json`;
  if (fs.existsSync(source)) {
    fs.cpSync(source, target, { preserveTimestamps: true });
  }
}

function restoreManifest() {
  const folder = getManifestFolder();
  const backup = `${folder}/manifest.backup.json`;
  const target = `${folder}/manifest.json`;
  if (fs.existsSync(backup)) {
    try {
      fs.cpSync(backup, target, { preserveTimestamps: true });
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }
}

/**
 * Playwright equivalent of the Selenium withFixtures pattern
 * This function sets up the complete test infrastructure:
 * - Manifest backup/modification (BEFORE extension loading)
 * - Anvil blockchain server
 * - Fixture server with state
 * - Mock server
 * - Extension initialization with fixture state
 *
 * @param options - Configuration options including fixtures and title
 * @param testSuite - The test function to execute with the configured page
 */
export async function withPlaywrightFixtures(
  options: PlaywrightFixtureOptions,
  testSuite: (args: PlaywrightTestArguments) => Promise<void>
): Promise<void> {
  const {
    fixtures = new FixtureBuilder().build(),
    title = 'Playwright Test',
    driverOptions = { timeOut: 10000 }, // Reduced from 15s to 10s
    localNodeOptions = 'anvil',
    testSpecificMock = () => Promise.resolve(),
    manifestFlags = {}
  } = options;

  let page: Page;
  let localNode: Anvil | undefined;
  let fixtureServer: any | undefined;
  let mockServer: any | undefined;
  let mockedEndpoint: any;

  // Store original env vars to restore later
  const originalEnv = {
    WITH_STATE: process.env.WITH_STATE,
    IN_TEST: process.env.IN_TEST,
    SELENIUM_BROWSER: process.env.SELENIUM_BROWSER
  };

  try {
    // Log test execution similar to Selenium withFixtures pattern
    console.log(`\nExecuting testcase: '${title}'\n`);

    // Set environment variables for fixture state loading
    process.env.WITH_STATE = 'true';
    process.env.IN_TEST = 'true';
    process.env.SELENIUM_BROWSER = 'chrome'; // Enable manifest flag system
    console.log('Environment variables set: WITH_STATE=true, IN_TEST=true, SELENIUM_BROWSER=chrome');

    // STEP 1: Backup and modify manifest BEFORE launching browser (same as Selenium)
    console.log('Backing up and modifying manifest...');
    restoreManifest(); // Restore any previous backup first
    backupManifest(); // Backup current manifest

    // Set manifest flags with permissions for fixture server
    const extendedManifestFlags = {
      ...manifestFlags,
      // Add permissions for fixture server connection
      permissions: [
        ...(manifestFlags.permissions || []),
        'http://localhost:12345/*',
        'http://localhost:8000/*'
      ]
    };

    await setManifestFlags(extendedManifestFlags);
    console.log('Manifest flags set with fixture server permissions');

    // STEP 2: Start infrastructure servers
    // Start Anvil server (blockchain)
    if (localNodeOptions === 'anvil' || (typeof localNodeOptions === 'object' && localNodeOptions)) {
      localNode = new Anvil();
      const anvilOptions = typeof localNodeOptions === 'object' ? localNodeOptions : {};
      await localNode.start(anvilOptions);
    }

    // Start fixture server
    fixtureServer = new FixtureServer();
    await fixtureServer.start();

    // Debug: Log fixture state before loading
    console.log('FixtureBuilder state created:');
    console.log('- Fixture has data:', !!fixtures.data);
    console.log('- OnboardingController.completedOnboarding:', fixtures.data?.OnboardingController?.completedOnboarding);
    console.log('- PreferencesController.selectedAddress:', fixtures.data?.PreferencesController?.selectedAddress);
    console.log('- AccountTracker accounts:', Object.keys(fixtures.data?.AccountTracker?.accounts || {}));

    fixtureServer.loadJsonState(fixtures, undefined);
    console.log('Fixture server started on localhost:12345, serving state at /state.json');

    // Debug: Verify fixture server is serving data
    setTimeout(async () => {
      try {
        const response = await fetch('http://localhost:12345/state.json');
        const data = await response.text();
        console.log(`Fixture server response status: ${response.status}`);
        console.log(`Fixture server response size: ${data.length} characters`);
        if (data.length > 0) {
          const parsed = JSON.parse(data);
          console.log('Fixture server serving data with keys:', Object.keys(parsed.data || {}));
        }
      } catch (e) {
        console.log('Error checking fixture server:', e.message);
      }
    }, 1000);

    // Start mock server
    const https = await mockttp.generateCACertificate();
    mockServer = mockttp.getLocal({ https, cors: true });

    const mockingResult = await setupMocking(
      mockServer,
      testSpecificMock,
      {
        chainId: 1337,
      }
    );
    mockedEndpoint = mockingResult.mockedEndpoint;

    await mockServer.start(8000);

    // STEP 3: Initialize extension (after manifest modification)
    const extension = new ChromeExtensionPage();
    page = await extension.initExtension();

    // Set timeout from options
    if (driverOptions.timeOut) {
      page.setDefaultTimeout(driverOptions.timeOut);
    }

    // Wait longer for the extension to connect to fixture server and load state
    console.log('Waiting for extension to connect to fixture server and load state...');

    // Monitor network requests to see if extension calls fixture server
    let fixtureRequests = 0;
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('localhost:12345')) {
        fixtureRequests++;
        console.log(`🌐 Extension made request to fixture server: ${url} (count: ${fixtureRequests})`);
      }
    });

    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('localhost:12345')) {
        console.log(`📥 Fixture server response: ${url} - Status: ${response.status()}`);
        if (url.includes('state.json')) {
          try {
            const data = await response.text();
            console.log(`📦 Fixture state loaded: ${data.length} characters`);
          } catch (e) {
            console.log('📦 Could not read fixture response body');
          }
        }
      }
    });

    // Wait for state loading - reduced timeout
    await new Promise(resolve => setTimeout(resolve, 3000)); // Reduced from 20s to 3s

    console.log(`🔍 After waiting, fixture server was called ${fixtureRequests} times`);

    // Do NOT login automatically - let the test handle the unlock screen (same as Selenium)
    // await loginWithBalanceValidation(page);

    // Execute the test suite
    await testSuite({
      page,
      localNode,
      mockedEndpoint,
      mockServer
    });

    console.log(`\nSuccess on testcase: '${title}'\n`);

  } catch (error) {
    console.log(`\nFailure on testcase: '${title}', error:`, error);
    throw error;
  } finally {
    // STEP 4: Restore manifest and cleanup (same as Selenium)
    try {
      console.log('Restoring original manifest...');
      restoreManifest();
    } catch (e) {
      console.warn('Error restoring manifest:', e);
    }

    // Restore original environment variables
    if (originalEnv.WITH_STATE !== undefined) {
      process.env.WITH_STATE = originalEnv.WITH_STATE;
    } else {
      delete process.env.WITH_STATE;
    }
    if (originalEnv.IN_TEST !== undefined) {
      process.env.IN_TEST = originalEnv.IN_TEST;
    } else {
      delete process.env.IN_TEST;
    }
    if (originalEnv.SELENIUM_BROWSER !== undefined) {
      process.env.SELENIUM_BROWSER = originalEnv.SELENIUM_BROWSER;
    } else {
      delete process.env.SELENIUM_BROWSER;
    }

    // Cleanup servers
    try {
      if (mockServer) {
        await mockServer.stop();
      }
      if (fixtureServer) {
        await fixtureServer.stop();
      }
      if (localNode && localNode.stop) {
        await localNode.stop();
      }
    } catch (cleanupError) {
      console.warn('Error during cleanup:', cleanupError);
    }
  }
}

/**
 * Helper function to create a fixture-based test setup
 * This can be used in test.beforeAll() hooks
 */
export async function setupPlaywrightFixtures(options: PlaywrightFixtureOptions = {}): Promise<{
  page: Page;
  localNode?: Anvil;
  mockServer?: any;
  cleanup: () => Promise<void>;
}> {
  const {
    fixtures = new FixtureBuilder().build(),
    driverOptions = { timeOut: 10000 }, // Reduced from 15s to 10s
    localNodeOptions = 'anvil',
    testSpecificMock = () => Promise.resolve(),
    manifestFlags = {}
  } = options;

  let localNode: Anvil | undefined;
  let fixtureServer: any | undefined;
  let mockServer: any | undefined;

  // Set environment variables for fixture state loading
  process.env.WITH_STATE = 'true';
  process.env.IN_TEST = 'true';
  process.env.SELENIUM_BROWSER = 'chrome'; // Enable manifest flag system

  // Backup and modify manifest
  restoreManifest();
  backupManifest();

  // Set manifest flags with permissions for fixture server
  const extendedManifestFlags = {
    ...manifestFlags,
    permissions: [
      ...(manifestFlags.permissions || []),
      'http://localhost:12345/*',
      'http://localhost:8000/*'
    ]
  };

  await setManifestFlags(extendedManifestFlags);

  // Start Anvil server
  if (localNodeOptions === 'anvil' || (typeof localNodeOptions === 'object' && localNodeOptions)) {
    localNode = new Anvil();
    const anvilOptions = typeof localNodeOptions === 'object' ? localNodeOptions : {};
    await localNode.start(anvilOptions);
  }

  // Start fixture server
  fixtureServer = new FixtureServer();
  await fixtureServer.start();
  fixtureServer.loadJsonState(fixtures, undefined);

  // Start mock server
  const https = await mockttp.generateCACertificate();
  mockServer = mockttp.getLocal({ https, cors: true });
  await setupMocking(mockServer, testSpecificMock, { chainId: 1337 });
  await mockServer.start(8000);

  // Initialize extension
  const extension = new ChromeExtensionPage();
  const page = await extension.initExtension();

  // Set timeout from options
  if (driverOptions.timeOut) {
    page.setDefaultTimeout(driverOptions.timeOut);
  }

  // Wait for extension to connect to fixture server and load state
  await new Promise(resolve => setTimeout(resolve, 2000)); // Reduced from 10s to 2s

  // Do NOT login automatically - let the test handle the unlock screen (same as Selenium)
  // await loginWithBalanceValidation(page);

  const cleanup = async () => {
    try {
      restoreManifest();
      if (mockServer) {
        await mockServer.stop();
      }
      if (fixtureServer) {
        await fixtureServer.stop();
      }
      if (localNode && localNode.stop) {
        await localNode.stop();
      }
    } catch (error) {
      console.warn('Error during cleanup:', error);
    }
  };

  return { page, localNode, mockServer, cleanup };
}