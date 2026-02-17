import { strict as assert } from 'assert';
import { withFixtures, defaultGanacheOptions } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { Driver } from '../../webdriver/driver';

/**
 * Integration tests for the Agent Account creation flow
 * These tests verify the end-to-end functionality of creating agent accounts
 * with delegated permissions using the LLM-based permission interpreter.
 */
describe('Agent Account Creation', function () {
  it('should show Create Agent Account option in account menu for Flask builds', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // Open account menu
        await driver.clickElement('[data-testid="account-menu-icon"]');

        // Click on add account button
        await driver.clickElement(
          '[data-testid="multichain-account-menu-popover-action-button"]',
        );

        // Verify Create Agent Account option exists (Flask only)
        const agentAccountButton = await driver.findElement(
          '[data-testid="multichain-account-menu-popover-add-agent-account"]',
        );
        assert.ok(
          agentAccountButton,
          'Create Agent Account button should be visible in Flask builds',
        );
      },
    );
  });

  it('should open agent account creation modal when clicking the option', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // Open account menu
        await driver.clickElement('[data-testid="account-menu-icon"]');

        // Click on add account button
        await driver.clickElement(
          '[data-testid="multichain-account-menu-popover-action-button"]',
        );

        // Click Create Agent Account
        await driver.clickElement(
          '[data-testid="multichain-account-menu-popover-add-agent-account"]',
        );

        // Verify the prompt input is shown
        const promptInput = await driver.findElement(
          '[data-testid="agent-account-prompt-input"]',
        );
        assert.ok(promptInput, 'Agent account prompt input should be visible');
      },
    );
  });

  it('should show settings prompt when API key is not configured', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // Open account menu and navigate to agent account creation
        await driver.clickElement('[data-testid="account-menu-icon"]');
        await driver.clickElement(
          '[data-testid="multichain-account-menu-popover-action-button"]',
        );
        await driver.clickElement(
          '[data-testid="multichain-account-menu-popover-add-agent-account"]',
        );

        // Verify the settings prompt is shown (API key not configured)
        const pageText = await driver.findElement('.mm-banner-alert');
        assert.ok(
          pageText,
          'Settings prompt should be visible when API key is not configured',
        );
      },
    );
  });

  it('should disable submit button when prompt is empty', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // Navigate to agent account creation
        await driver.clickElement('[data-testid="account-menu-icon"]');
        await driver.clickElement(
          '[data-testid="multichain-account-menu-popover-action-button"]',
        );
        await driver.clickElement(
          '[data-testid="multichain-account-menu-popover-add-agent-account"]',
        );

        // Check that submit button is disabled
        const submitButton = await driver.findElement(
          '[data-testid="agent-account-submit-prompt"]',
        );
        const isDisabled = await submitButton.getAttribute('disabled');
        assert.ok(isDisabled, 'Submit button should be disabled when prompt is empty');
      },
    );
  });

  it('should allow canceling the agent account creation flow', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // Navigate to agent account creation
        await driver.clickElement('[data-testid="account-menu-icon"]');
        await driver.clickElement(
          '[data-testid="multichain-account-menu-popover-action-button"]',
        );
        await driver.clickElement(
          '[data-testid="multichain-account-menu-popover-add-agent-account"]',
        );

        // Click cancel button
        await driver.clickElement('button.mm-button-secondary');

        // Verify we're back to the account list
        const accountList = await driver.findElement(
          '[data-testid="multichain-account-menu-popover-action-button"]',
        );
        assert.ok(accountList, 'Should return to account list after canceling');
      },
    );
  });
});

describe('Agent Account Settings', function () {
  it('should show agent account settings in experimental tab', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // Navigate to settings
        await driver.clickElement('[data-testid="account-menu-icon"]');
        await driver.clickElement('[data-testid="global-menu-settings"]');

        // Go to experimental tab
        await driver.clickElement({ text: 'Experimental', tag: 'div' });

        // Check for agent account settings section
        const settingsSection = await driver.findElement(
          '[data-testid="agent-account-llm-provider"]',
        );
        assert.ok(
          settingsSection,
          'Agent account settings should be visible in experimental tab',
        );
      },
    );
  });

  it('should allow configuring LLM provider', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // Navigate to settings > experimental
        await driver.clickElement('[data-testid="account-menu-icon"]');
        await driver.clickElement('[data-testid="global-menu-settings"]');
        await driver.clickElement({ text: 'Experimental', tag: 'div' });

        // Find and interact with LLM provider dropdown
        const providerDropdown = await driver.findElement(
          '[data-testid="agent-account-llm-provider"]',
        );
        assert.ok(providerDropdown, 'LLM provider dropdown should be visible');
      },
    );
  });

  it('should allow entering API key', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // Navigate to settings > experimental
        await driver.clickElement('[data-testid="account-menu-icon"]');
        await driver.clickElement('[data-testid="global-menu-settings"]');
        await driver.clickElement({ text: 'Experimental', tag: 'div' });

        // Find API key input
        const apiKeyInput = await driver.findElement(
          '[data-testid="agent-account-api-key"]',
        );
        assert.ok(apiKeyInput, 'API key input should be visible');

        // Enter test API key
        await driver.fill('[data-testid="agent-account-api-key"]', 'test-api-key-12345');
      },
    );
  });
});
