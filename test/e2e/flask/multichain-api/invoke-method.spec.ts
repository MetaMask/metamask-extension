import { strict as assert } from 'assert';
import {
  ACCOUNT_1,
  ACCOUNT_2,
  largeDelayMs,
  WINDOW_TITLES,
  withFixtures,
} from '../../helpers';
import { Driver } from '../../webdriver/driver';
import FixtureBuilder from '../../fixture-builder';
import {
  initCreateSessionScopes,
  DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
  openMultichainDappAndConnectWalletWithExternallyConnectable,
  addAccountInWalletAndAuthorize,
} from './testHelpers';

describe('Multichain API', function () {
  const GANACHE_SCOPES = ['eip155:1337', 'eip155:1338', 'eip155:1000'];
  const ACCOUNTS = [ACCOUNT_1, ACCOUNT_2];
  const DEFAULT_INITIAL_BALANCE_HEX = '0x15af1d78b58c40000';

  describe('Calling `wallet_invokeMethod` on the same dapp across three different connected chains', function () {
    describe('Read operations: calling different methods on each connected scope', function () {
      it('Should match selected method to the expected output', async function () {
        await withFixtures(
          {
            title: this.test?.fullTitle(),
            fixtures: new FixtureBuilder()
              .withNetworkControllerTripleGanache()
              .build(),
            ...DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
          },
          async ({
            driver,
            extensionId,
          }: {
            driver: Driver;
            extensionId: string;
          }) => {
            await openMultichainDappAndConnectWalletWithExternallyConnectable(
              driver,
              extensionId,
            );
            await initCreateSessionScopes(driver, GANACHE_SCOPES, ACCOUNTS);
            await addAccountInWalletAndAuthorize(driver);
            await driver.clickElement({ text: 'Connect', tag: 'button' });
            await driver.delay(largeDelayMs);
            await driver.switchToWindowWithTitle(
              WINDOW_TITLES.MultichainTestDApp,
            );

            const TEST_METHODS = {
              [GANACHE_SCOPES[0]]: 'eth_chainId',
              [GANACHE_SCOPES[1]]: 'eth_getBalance',
              [GANACHE_SCOPES[2]]: 'eth_gasPrice',
            };
            const EXPECTED_RESULTS = {
              [GANACHE_SCOPES[0]]: '0x539',
              [GANACHE_SCOPES[1]]: DEFAULT_INITIAL_BALANCE_HEX,
              [GANACHE_SCOPES[2]]: '0x77359400',
            };

            const scopeCards = await driver.findElements('.scope-card');

            for (const i of scopeCards.keys()) {
              const scope = GANACHE_SCOPES[i];
              const invokeMethod = TEST_METHODS[GANACHE_SCOPES[i]];
              await driver.clickElementSafe(
                `[data-testid="${scope}-${invokeMethod}-option"]`,
              );

              await driver.clickElementSafe(
                `[data-testid="invoke-method-${scope}-btn"]`,
              );

              /**
               * We need to escape colon character on the scope, otherwise selenium will treat this as an invalid selector
               */
              const resultElement = await driver.findElement(
                `#invoke-method-${scope.replace(
                  ':',
                  '\\:',
                )}-${invokeMethod}-result-0`,
              );

              const result = await resultElement.getText();

              assert.strictEqual(
                result,
                `"${EXPECTED_RESULTS[scope]}"`,
                `${scope} method ${invokeMethod} expected "${EXPECTED_RESULTS[scope]}", got ${result} instead`,
              );
            }
          },
        );
      });
    });

    describe('Write operations: calling `eth_sendTransaction` on each connected scope', function () {
      const INDEX_FOR_ALTERNATE_ACCOUNT = 1;

      it('should match chosen addresses in each chain to the selected address per scope in extension window', async function () {
        await withFixtures(
          {
            title: this.test?.fullTitle(),
            fixtures: new FixtureBuilder()
              .withNetworkControllerTripleGanache()
              .build(),
            ...DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
          },
          async ({
            driver,
            extensionId,
          }: {
            driver: Driver;
            extensionId: string;
          }) => {
            await openMultichainDappAndConnectWalletWithExternallyConnectable(
              driver,
              extensionId,
            );
            await initCreateSessionScopes(driver, GANACHE_SCOPES, ACCOUNTS);
            await addAccountInWalletAndAuthorize(driver);
            await driver.clickElement({ text: 'Connect', tag: 'button' });

            await driver.delay(largeDelayMs);
            await driver.switchToWindowWithTitle(
              WINDOW_TITLES.MultichainTestDApp,
            );

            const scopeCards = await driver.findElements('.scope-card');
            for (const i of scopeCards.keys()) {
              const scope = GANACHE_SCOPES[i];
              await driver.clickElementSafe(
                `[data-testid="${scope}-eth_sendTransaction-option"]`,
              );

              i === INDEX_FOR_ALTERNATE_ACCOUNT &&
                (await driver.clickElementSafe(
                  `[data-testid="${scope}:${ACCOUNT_2}-option"]`,
                ));
            }

            await driver.clickElement({
              text: 'Invoke All Selected Methods',
              tag: 'button',
            });

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            for (const i of GANACHE_SCOPES.keys()) {
              await driver.delay(largeDelayMs);
              await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

              const accountWebElement = await driver.findElement(
                '[data-testid="sender-address"]',
              );
              const accountText = await accountWebElement.getText();
              const expectedAccount =
                i === INDEX_FOR_ALTERNATE_ACCOUNT ? 'Account 2' : 'Account 1';

              assert.strictEqual(
                accountText,
                expectedAccount,
                `Should have ${expectedAccount} selected, got ${accountText}`,
              );

              await driver.clickElement({
                text: 'Confirm',
                tag: 'button',
              });
            }
          },
        );
      });

      it('should have less balance due to gas after transaction is sent', async function () {
        await withFixtures(
          {
            title: this.test?.fullTitle(),
            fixtures: new FixtureBuilder()
              .withNetworkControllerTripleGanache()
              .build(),
            ...DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
          },
          async ({
            driver,
            extensionId,
          }: {
            driver: Driver;
            extensionId: string;
          }) => {
            await openMultichainDappAndConnectWalletWithExternallyConnectable(
              driver,
              extensionId,
            );
            await initCreateSessionScopes(driver, GANACHE_SCOPES, ACCOUNTS);
            await addAccountInWalletAndAuthorize(driver);
            await driver.clickElement({ text: 'Connect', tag: 'button' });

            await driver.delay(largeDelayMs);
            await driver.switchToWindowWithTitle(
              WINDOW_TITLES.MultichainTestDApp,
            );

            const scopeCards = await driver.findElements('.scope-card');

            for (const i of scopeCards.keys()) {
              const scope = GANACHE_SCOPES[i];
              await driver.clickElementSafe(
                `[data-testid="${scope}-eth_sendTransaction-option"]`,
              );

              i === INDEX_FOR_ALTERNATE_ACCOUNT &&
                (await driver.clickElementSafe(
                  `[data-testid="${scope}:${ACCOUNT_2}-option"]`,
                ));
            }

            await driver.clickElement({
              text: 'Invoke All Selected Methods',
              tag: 'button',
            });

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            for (const _ of GANACHE_SCOPES) {
              await driver.delay(largeDelayMs);
              await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
              await driver.clickElement({
                text: 'Confirm',
                tag: 'button',
              });
            }

            await driver.delay(largeDelayMs);
            await driver.switchToWindowWithTitle(
              WINDOW_TITLES.MultichainTestDApp,
            );

            await driver.clickElementSafe({
              text: 'Clear Results',
              tag: 'button',
            });

            for (const i of scopeCards.keys()) {
              const scope = GANACHE_SCOPES[i];
              await driver.clickElementSafe(
                `[data-testid="${scope}-eth_getBalance-option"]`,
              );

              await driver.delay(largeDelayMs);
              await driver.clickElementSafe(
                `[data-testid="invoke-method-${scope}-btn"]`,
              );

              const resultWebElement = await driver.findElement(
                `#invoke-method-${scope.replace(
                  ':',
                  '\\:',
                )}-eth_getBalance-result-0`,
              );
              const currentBalance = await resultWebElement.getText();

              assert.notStrictEqual(
                currentBalance,
                `"${DEFAULT_INITIAL_BALANCE_HEX}"`, // default initial hex balance
                `${scope} scope balance should be different after eth_sendTransaction due to gas`,
              );
            }
          },
        );
      });
    });
  });
});
