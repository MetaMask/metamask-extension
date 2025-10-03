import { strict as assert } from 'assert';
import { By } from 'selenium-webdriver';
import { largeDelayMs } from '../../../helpers';
import TestDappMultichain from '../../../page-objects/pages/test-dapp-multichain';
import { DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS } from '../testHelpers';
import { withSolanaAccountSnap } from '../../../tests/solana/common-solana';
import { switchToAccount } from '../../solana-wallet-standard/testHelpers';

describe('Multichain API - Non EVM', function () {
  const SOLANA_SCOPE = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';
  describe("Call `wallet_createSession` with both EVM and Solana scopes that match the user's enabled networks", function () {
    it('should only select the specified scopes requested by the user', async function () {
      await withSolanaAccountSnap(
        {
          ...DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
          title: this.test?.fullTitle(),
        },
        async (driver, _, extensionId) => {
          const requestScopesToNetworkMap = {
            'eip155:1': 'Ethereum',
            [SOLANA_SCOPE]: 'Solana',
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
      await withSolanaAccountSnap(
        {
          ...DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
          title: this.test?.fullTitle(),
          numberOfAccounts: 2,
        },
        async (driver, _, extensionId) => {
          const testDapp = new TestDappMultichain(driver);
          await switchToAccount(driver, 'Solana 1'); // we make sure to manually select account 1 as default
          await testDapp.openTestDappPage();
          await testDapp.connectExternallyConnectable(extensionId);
          await testDapp.initCreateSessionScopes([SOLANA_SCOPE]);

          const editButtons = await driver.findElements('[data-testid="edit"]');
          await editButtons[0].click();

          const checkboxes = await driver.findElements(
            'input[type="checkbox" i]',
          );

          // 0 index is select all, 1 index is EVM default account, 2 index is Solana account 1 (default)
          const accountCheckbox = checkboxes[2];
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
