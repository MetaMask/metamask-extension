#!/usr/bin/env npx tsx
/**
 * LLM Workflow Examples
 *
 * This file demonstrates all the capabilities of the LLM workflow for
 * MetaMask extension automation. Run individual examples by uncommenting
 * the desired function call at the bottom of this file.
 */

import {
  launchMetaMask,
  DEFAULT_PASSWORD,
  HomePage,
  createFixtureBuilder,
  FixturePresets,
} from '.';

async function exampleDefault() {
  console.log('=== Example: Default Pre-Onboarded Wallet ===\n');

  const launcher = await launchMetaMask({
    autoBuild: false,
  });

  try {
    const page = launcher.getPage();
    console.log(`URL: ${page.url()}`);

    await launcher.unlock(DEFAULT_PASSWORD);
    console.log('Wallet unlocked');

    const homePage = new HomePage(page);
    const balance = await homePage.getBalance();
    console.log(`Balance: ${balance}`);

    await launcher.screenshot({ name: 'example-default' });
  } finally {
    await launcher.cleanup();
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function exampleOnboarding() {
  console.log('=== Example: Fresh Wallet Onboarding ===\n');

  const launcher = await launchMetaMask({
    autoBuild: false,
    stateMode: 'onboarding',
  });

  try {
    console.log('Completing onboarding...');
    await launcher.completeOnboarding({
      password: 'MySecurePassword123!',
    });
    console.log('Onboarding complete!');

    await launcher.screenshot({ name: 'example-onboarding-complete' });
  } finally {
    await launcher.cleanup();
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function exampleCustomFixture() {
  console.log('=== Example: Custom Fixture State ===\n');

  const fixture = createFixtureBuilder()
    .withPreferencesController({
      showTestNetworks: true,
      useNftDetection: true,
    })
    .withPopularNetworks()
    .build();

  const launcher = await launchMetaMask({
    autoBuild: false,
    stateMode: 'custom',
    fixture,
  });

  try {
    await launcher.unlock(DEFAULT_PASSWORD);
    console.log('Wallet unlocked with custom state');

    await launcher.screenshot({ name: 'example-custom-fixture' });
  } finally {
    await launcher.cleanup();
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function examplePresets() {
  console.log('=== Example: Fixture Presets ===\n');

  const launcher = await launchMetaMask({
    autoBuild: false,
    stateMode: 'custom',
    fixture: FixturePresets.withMultipleAccounts(),
  });

  try {
    await launcher.unlock(DEFAULT_PASSWORD);
    console.log('Wallet with multiple accounts loaded');

    await launcher.screenshot({ name: 'example-presets' });
  } finally {
    await launcher.cleanup();
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function exampleMockServer() {
  console.log('=== Example: With Mock Server ===\n');

  const launcher = await launchMetaMask({
    autoBuild: false,
    mockServer: {
      enabled: true,
      testSpecificMock: async (server) => {
        await server.forGet(/token\.api/u).thenJson(200, {
          tokens: [{ symbol: 'TEST', name: 'Test Token', address: '0x123...' }],
        });
      },
    },
  });

  try {
    await launcher.unlock(DEFAULT_PASSWORD);
    console.log('Wallet launched with mocked APIs');

    await launcher.screenshot({ name: 'example-mock-server' });
  } finally {
    await launcher.cleanup();
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function exampleScreenshotInspection() {
  console.log('=== Example: Screenshot and State Inspection ===\n');

  const launcher = await launchMetaMask({
    autoBuild: false,
  });

  try {
    await launcher.unlock(DEFAULT_PASSWORD);

    const state = await launcher.getState();
    console.log('Extension State:', state);

    const screenshot = await launcher.screenshot({
      name: 'inspection',
      fullPage: true,
      timestamp: true,
    });

    console.log(`Screenshot saved: ${screenshot.path}`);
    console.log(`Dimensions: ${screenshot.width}x${screenshot.height}`);
  } finally {
    await launcher.cleanup();
  }
}

(async () => {
  try {
    await exampleDefault();
    // Uncomment to run other examples:
    // await exampleOnboarding();
    // await exampleCustomFixture();
    // await examplePresets();
    // await exampleMockServer();
    // await exampleScreenshotInspection();
  } catch (error) {
    console.error('Example failed:', error);
    process.exit(1);
  }
})();
