import * as path from 'path';
import { strict as assert } from 'assert';
import {
  ACCOUNT_1,
  ACCOUNT_2,
  largeDelayMs,
  multipleGanacheOptions,
  unlockWallet,
  veryLargeDelayMs,
  WINDOW_TITLES,
  withFixtures,
} from '../../helpers';
import { Driver } from '../../webdriver/driver';
import FixtureBuilder from '../../fixture-builder';
import { DAPP_ONE_URL, DAPP_URL } from '../../constants';
import {
  initCreateSessionScopes,
  openMultichainDappAndConnectWalletWithExternallyConnectable,
  addAccountInWalletAndAuthorize,
  escapeColon,
} from './testHelpers';

describe('Multichain API', function () {
  const SCOPE = 'eip155:1337';
  const DAPP_URLS = [DAPP_URL, DAPP_ONE_URL];
  const ACCOUNTS = [ACCOUNT_1, ACCOUNT_2];
  const MULTI_DAPP_OPTIONS_SETUP = {
    fixtures: new FixtureBuilder()
      .withPermissionControllerConnectedToTwoMultichainTestDapps()
      .build(),
    dapp: true,
    dappOptions: {
      numberOfDapps: 2,
    },
    dappPath: path.join(
      '..',
      '..',
      'node_modules',
      '@metamask',
      'test-dapp-multichain',
      'build',
    ),
    ganacheOptions: {
      ...multipleGanacheOptions,
      concurrent: [
        {
          port: 8546,
          chainId: 1338,
          ganacheOptions2: multipleGanacheOptions,
        },
        {
          port: 7777,
          chainId: 1000,
          ganacheOptions2: multipleGanacheOptions,
        },
      ],
    },
  };

  describe('Calling `wallet_invokeMethod` on the same chain across two different dapps', function () {
    describe('Read operations: calling different methods on each dapp', function () {
      it('Should match selected method to the expected output', async function () {
        await withFixtures(
          {
            title: this.test?.fullTitle(),
            ...MULTI_DAPP_OPTIONS_SETUP,
          },
          async ({
            driver,
            extensionId,
          }: {
            driver: Driver;
            extensionId: string;
          }) => {
            await unlockWallet(driver);
            for (const dapp of DAPP_URLS) {
              await openMultichainDappAndConnectWalletWithExternallyConnectable(
                driver,
                extensionId,
                dapp,
                true,
              );
              await initCreateSessionScopes(driver, [SCOPE], ACCOUNTS);
              await addAccountInWalletAndAuthorize(driver);
              await driver.clickElement({ text: 'Connect', tag: 'button' });
              await driver.delay(largeDelayMs);
              await driver.switchToWindowWithUrl(dapp);
            }

            const TEST_METHODS = {
              [DAPP_URLS[0]]: 'eth_chainId',
              [DAPP_URLS[1]]: 'eth_gasPrice',
            };
            const EXPECTED_RESULTS = {
              [DAPP_URLS[0]]: '0x539',
              [DAPP_URLS[1]]: '0x77359400',
            };

            for (const dapp of DAPP_URLS) {
              const invokeMethod = TEST_METHODS[dapp];
              await driver.switchToWindowWithUrl(dapp);
              await driver.clickElementSafe(
                `[data-testid="${SCOPE}-${invokeMethod}-option"]`,
              );

              await driver.clickElementSafe(
                `[data-testid="invoke-method-${SCOPE}-btn"]`,
              );

              const resultElement = await driver.findElement(
                `#invoke-method-${escapeColon(SCOPE)}-${invokeMethod}-result-0`,
              );

              const result = await resultElement.getText();

              assert.strictEqual(
                result,
                `"${EXPECTED_RESULTS[dapp]}"`,
                `Dapp ${dapp} method ${invokeMethod} expected "${EXPECTED_RESULTS[dapp]}", got ${result} instead`,
              );
            }
          },
        );
      });
    });

    describe('Write operations: calling `eth_sendTransaction` on each dapp', function () {
      const INDEX_FOR_ALTERNATE_ACCOUNT = 1;

      it('should match chosen addresses in each dapp and request origin to the selected address per scope and origin in extension window', async function () {
        await withFixtures(
          {
            title: this.test?.fullTitle(),
            ...MULTI_DAPP_OPTIONS_SETUP,
          },
          async ({
            driver,
            extensionId,
          }: {
            driver: Driver;
            extensionId: string;
          }) => {
            // Arrange
            await unlockWallet(driver);
            for (const dapp of DAPP_URLS) {
              await openMultichainDappAndConnectWalletWithExternallyConnectable(
                driver,
                extensionId,
                dapp,
                true,
              );
              await initCreateSessionScopes(driver, [SCOPE], ACCOUNTS);
              await addAccountInWalletAndAuthorize(driver);
              await driver.clickElement({ text: 'Connect', tag: 'button' });
            }

            // Act
            for (const [i, dapp] of DAPP_URLS.entries()) {
              await driver.switchToWindowWithUrl(dapp);
              await driver.delay(veryLargeDelayMs);
              await driver.clickElementSafe(
                `[data-testid="${SCOPE}-eth_sendTransaction-option"]`,
              );

              i === INDEX_FOR_ALTERNATE_ACCOUNT &&
                (await driver.clickElementSafe(
                  `[data-testid="${SCOPE}:${ACCOUNT_2}-option"]`,
                ));

              await driver.clickElementSafe(
                `[data-testid="invoke-method-${SCOPE}-btn"]`,
              );
            }

            await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

            // Assert
            for (const [i, dapp] of DAPP_URLS.entries()) {
              const accountWebElement = await driver.findElement(
                '[data-testid="sender-address"]',
              );
              const accountText = await accountWebElement.getText();
              const expectedAccount =
                i === INDEX_FOR_ALTERNATE_ACCOUNT ? 'Account 2' : 'Account 1';

              const originWebElement = await driver.findElement(
                '[data-testid="transaction-details-origin-row"]',
              );
              const originText = await originWebElement.getText();
              const expectedOrigin = DAPP_URLS[i].replace('http://', '');

              assert.strictEqual(
                accountText,
                expectedAccount,
                `Queued request from dapp ${dapp} should have ${expectedAccount} selected, got ${accountText}`,
              );

              assert.ok(
                originText.includes(expectedOrigin),
                `Queued request from dapp ${dapp} should have origin as ${expectedOrigin}`,
              );

              await driver.clickElement({
                text: 'Cancel',
                tag: 'button',
              });
            }
          },
        );
      });
    });
  });
});
