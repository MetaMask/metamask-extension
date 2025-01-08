import { Suite } from 'mocha';
import {
  logInWithBalanceValidation,
  PRIVATE_KEY_TWO,
  withFixtures,
} from '../../helpers';
import { BridgePage, getBridgeFixtures } from './bridge-test-utils';
import { DEFAULT_FEATURE_FLAGS_RESPONSE } from './constants';
const TENDERLY_RPC_URL =
  'https://rpc.vnet.tenderly.co/devnet/tenderly-mainnet/a0b9240e-e276-4c09-9d6c-d8557819db2b';

describe('Click bridge button @no-mmi', function (this: Suite) {
  it('loads placeholder swap route from wallet overview when flag is turned on', async function () {
    await withFixtures(
      getBridgeFixtures(this.test?.fullTitle(), {
        'extension-config': {
          ...DEFAULT_FEATURE_FLAGS_RESPONSE['extension-config'],
          support: true,
        },
      }),
      async ({ driver, ganacheServer }) => {
        const bridgePage = new BridgePage(driver);
        await logInWithBalanceValidation(driver, ganacheServer);

        // Import private key for bridge otherwise quotes return []
        // await driver.clickElement('[data-testid="account-menu-icon"]');
        // await driver.clickElement(
        //   '[data-testid="multichain-account-menu-popover-action-button"]',
        // );
        // await driver.clickElement({ text: 'Import account', tag: 'button' });
        // await driver.findClickableElement('#private-key-box');
        // await driver.fill('#private-key-box', PRIVATE_KEY_TWO);
        // await driver.clickElement(
        //   '[data-testid="import-account-confirm-button"]',
        // );

        // Add tenderly network
        await driver.clickElement('[data-testid="network-display"]');
        await driver.clickElement(
          '[data-testid="network-list-item-options-button-0x1"]',
        );
        await driver.clickElement(
          '[data-testid="network-list-item-options-edit"]',
        );
        await driver.clickElement('[data-testid="test-add-rpc-drop-down"]');
        await driver.clickElement({
          text: 'Add RPC URL',
          tag: 'button',
        });
        await driver.fill(
          '[data-testid="rpc-url-input-test"]',
          TENDERLY_RPC_URL,
        );
        await driver.clickElement({
          text: 'Add URL',
          tag: 'button',
        });
        await driver.clickElement({
          text: 'Save',
          tag: 'button',
        });

        // Add bridge data
        await bridgePage.navigateToBridgePage();
        // await bridgePage.verifySwapPage(1);

        // check slippage
        await driver.clickElement('.mm-box button[aria-label="Settings"]');
        await driver.clickElement('.mm-box button[aria-label="Close"]');
        // await driver.clickElement('button:nth-child(2)');
        // await driver.clickElement('.mm-box button[aria-label="Submit"]');

        await bridgePage.getBridgeQuote('1', 'Linea');

        // Check more quotes

        // Submit bridge
        await driver.clickElement({
          text: 'Submit',
          tag: 'button',
        });
        // Go and check activity
        const activity = await driver.findElement(
          '[data-testid="activity-list-item-action"]',
        );
        assert.equal(await activity.getText(), 'Bridge to Linea Mainnet');

        const primaryCurrency = await driver.findElement(
          '[data-testid="transaction-list-item-primary-currency"]',
        );
        assert.equal(await primaryCurrency.getText(), '-1 ETH');

        await driver.clickElement('[data-testid="activity-list-item-action"]');
        console.log('test3');

        await driver.delay(3000);
      },
    );
  });
});
