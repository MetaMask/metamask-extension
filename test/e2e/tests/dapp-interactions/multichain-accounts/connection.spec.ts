import { Suite } from 'mocha';
import { strict as assert } from 'assert';
import { WINDOW_TITLES } from '../../../helpers';
import TestDappMultichain from '../../../page-objects/pages/test-dapp-multichain';
import { Driver } from '../../../webdriver/driver';
import {
  checkPermissions,
  connectToMultichainTestDapp,
  removePermissions,
  SECOND_MULTICHAIN_ACCOUNT_IN_SECOND_TEST_E2E,
  validateSessionScopes,
  withMultichainAccountsAndDappConnectionFixture,
} from './common';
import Confirmation from '../../../page-objects/pages/confirmations/redesign/confirmation';

// TODO: find a way to get default number of chains that a client has.
const DEFAULT_EVM_NETWORKS = ['eip155:1', 'eip155:59144', 'eip155:8453']; // mainnet, linea, base
const DEFAULT_NON_EVM_NETWORKS = ['solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp']; // solana mainnet
const DEFAULT_TESTNET_NETWORKS = [
  'eip155:11155111',
  'eip155:59141',
  'eip155:1337',
  'eip155:6342',
  'eip155:10143',
]; // sepolia, linea sepolia, localhost, megatestnet, monad testnet
const DEFAULT_TESTNET_NON_EVM_NETWORKS = [
  'solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z',
  'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
]; // solana testnet, solana devnet

const EXPECTED_EVM_SCOPES = [
  ...DEFAULT_EVM_NETWORKS,
  ...DEFAULT_TESTNET_NETWORKS,
];
const EXPECTED_NON_EVM_SCOPES = [
  ...DEFAULT_NON_EVM_NETWORKS,
  ...DEFAULT_TESTNET_NON_EVM_NETWORKS,
];
const EXPECTED_SCOPES = [...EXPECTED_EVM_SCOPES, ...EXPECTED_NON_EVM_SCOPES];
const DEFAULT_NUMBER_OF_NETWORKS = EXPECTED_SCOPES.length;

describe('Bip 44 Permissions', function (this: Suite) {
  it('grants all default chain permissions when connecting', async function () {
    await withMultichainAccountsAndDappConnectionFixture(
      {
        title: this.test?.fullTitle(),
      },
      async (driver: Driver, extensionId: string) => {
        await connectToMultichainTestDapp(
          driver,
          extensionId,
          SECOND_MULTICHAIN_ACCOUNT_IN_SECOND_TEST_E2E,
        );
        await checkPermissions(driver, DEFAULT_NUMBER_OF_NETWORKS);
      },
    );
  });

  it('connects bip44 accounts and is able to sign', async function () {
    await withMultichainAccountsAndDappConnectionFixture(
      {
        title: this.test?.fullTitle(),
      },
      async (driver: Driver, extensionId: string) => {
        // Should be able to connect to dapps with the ethereum provider and sign personal sign
        await connectToMultichainTestDapp(
          driver,
          extensionId,
          SECOND_MULTICHAIN_ACCOUNT_IN_SECOND_TEST_E2E,
          false,
        );

        const testDapp = new TestDappMultichain(driver);
        await testDapp.checkPageIsLoaded();
        await testDapp.invokeMethod({
          scope: 'eip155:1',
          method: 'personal_sign',
        });

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const confirmationPage = new Confirmation(driver);
        await confirmationPage.checkPageIsLoaded();
        await confirmationPage.clickFooterConfirmButtonAndAndWaitForWindowToClose();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.MultichainTestDApp);
        const evmResult = await testDapp.getInvokeMethodResult({
          scope: 'eip155:1',
          method: 'personal_sign',
        });

        const expectedEvmSignedResult =
          '0x8ea024660dad01befb17e239d73bc17200d263d7cc2d4f2cac09a4c56dbc32173c47a8061de5e6f52330579add853e35f8d29d13bd08fb8b750561ec92287f371c';
        assert.ok(evmResult.includes(expectedEvmSignedResult));

        await testDapp.invokeMethod({
          scope: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
          method: 'signMessage',
        });

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.waitForSelector({
          testId: 'confirm-sign-message-confirm-snap-footer-button',
          text: 'Confirm',
        });
        await driver.clickElement({
          testId: 'confirm-sign-message-confirm-snap-footer-button',
          text: 'Confirm',
        });

        await driver.switchToWindowWithTitle(WINDOW_TITLES.MultichainTestDApp);
        const solanaResult = await testDapp.getInvokeMethodResult({
          scope: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
          method: 'signMessage',
        });

        const expectedSolanaSignedResult =
          '"signature":"5fkrEnJPrU3LpRxAvyJ1YZrsLXm3tASjvTKVNvPB1e5A29nfCcoLe9vqhEj1RnmnUQy1R7MtyoJNthVzcmyhNXaF"';
        assert.ok(solanaResult.includes(expectedSolanaSignedResult));
      },
    );
  });

  it('is able to remove permissions', async function () {
    await withMultichainAccountsAndDappConnectionFixture(
      {
        title: this.test?.fullTitle(),
      },
      async (driver: Driver, extensionId: string) => {
        await connectToMultichainTestDapp(
          driver,
          extensionId,
          SECOND_MULTICHAIN_ACCOUNT_IN_SECOND_TEST_E2E,
          false,
        );
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        const chainsToRemove = ['eip155:1'];
        await removePermissions(driver, chainsToRemove);

        // Go back to test dapp and get scopes
        await driver.switchToWindowWithTitle(WINDOW_TITLES.MultichainTestDApp);
        const testDapp = new TestDappMultichain(driver);
        await testDapp.checkPageIsLoaded();
        const newgetSessionResult = await testDapp.getSession();

        const expectedEvmScopes = EXPECTED_EVM_SCOPES.filter(
          (scope: string) => !chainsToRemove.includes(scope),
        );
        const expectedNonEvmScopes = EXPECTED_NON_EVM_SCOPES.filter(
          (scope: string) => !chainsToRemove.includes(scope),
        );
        validateSessionScopes(
          newgetSessionResult,
          SECOND_MULTICHAIN_ACCOUNT_IN_SECOND_TEST_E2E,
          expectedEvmScopes,
          expectedNonEvmScopes,
        );
      },
    );
  });
});
