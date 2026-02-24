import { strict as assert } from 'assert';
import { By } from 'selenium-webdriver';
import { largeDelayMs, withFixtures } from '../../../helpers';
import { SOLANA_MAINNET_SCOPE } from '../../../constants';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { loginWithBalanceValidation } from '../../../page-objects/flows/login.flow';
import { addAccount } from '../../../page-objects/flows/add-account.flow';
import TestDappMultichain from '../../../page-objects/pages/test-dapp-multichain';
import { DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS } from '../testHelpers';

describe('Multichain API - Non EVM', function () {
  describe("Call `wallet_createSession` with both EVM and Solana scopes that match the user's enabled networks", function () {
    it('should only select the specified scopes requested by the user', async function () {
      await withFixtures(
        {
          ...DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
          fixtures: new FixtureBuilderV2().build(),
          title: this.test?.fullTitle(),
        },
        async ({ driver, extensionId }) => {
          await loginWithBalanceValidation(driver);
          const requestScopesToNetworkMap = {
            'eip155:1': 'Ethereum',
            [SOLANA_MAINNET_SCOPE]: 'Solana',
          };

          const requestScopes = Object.keys(requestScopesToNetworkMap);
          const networksToRequest = Object.values(requestScopesToNetworkMap);

          const testDapp = new TestDappMultichain(driver);
          await testDapp.openTestDappPage();
          await testDapp.connectExternallyConnectable(extensionId);
          await testDapp.initCreateSessionScopes(requestScopes);

          // navigate to network selection screen
          const permissionsTab = await driver.findElement(
            '[data-testid="permissions-tab"]',
          );
          await permissionsTab.click();
          const editButtons = await driver.findElements('[data-testid="edit"]');
          await editButtons[1].click();
          await driver.delay(largeDelayMs);

          const networkListItems = await driver.findElements(
            '.multichain-network-list-item',
          );

          for (const item of networkListItems) {
            const networkNameDiv = await item.findElement(
              By.css('div[data-testid]'),
            );
            const network = await networkNameDiv.getAttribute('data-testid');

            const checkbox = await item.findElement(
              By.css('input[type="checkbox"]'),
            );
            const isChecked = await checkbox.isSelected();
            if (networksToRequest.includes(network)) {
              assert.strictEqual(
                isChecked,
                true,
                `Expected ${network} to be selected.`,
              );
            } else {
              assert.strictEqual(
                isChecked,
                false,
                `Expected ${network} to NOT be selected.`,
              );
            }
          }
        },
      );
    });
  });

  describe('Connect wallet to the multichain dapp via `externally_connectable`, call `wallet_createSession` with Solana scope, without any accounts requested', function () {
    it('should automatically select the current active Solana account', async function () {
      await withFixtures(
        {
          ...DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
          fixtures: new FixtureBuilderV2().build(),
          title: this.test?.fullTitle(),
        },
        async ({ driver, extensionId }) => {
          await loginWithBalanceValidation(driver);
          await addAccount({ driver, switchToAccount: 'Account 1' });

          const testDapp = new TestDappMultichain(driver);
          await testDapp.openTestDappPage();
          await testDapp.connectExternallyConnectable(extensionId);
          await testDapp.initCreateSessionScopes([SOLANA_MAINNET_SCOPE]);

          const editButtons = await driver.findElements('[data-testid="edit"]');
          await editButtons[0].click();

          const checkboxes = await driver.findElements(
            'input[type="checkbox" i]',
          );

          const accountCheckbox = checkboxes[0];
          const isChecked = await accountCheckbox.isSelected();

          assert.strictEqual(
            isChecked,
            true,
            'current active account in the wallet should be automatically selected',
          );
        },
      );
    });
  });
});
