import { strict as assert } from 'assert';
import { By } from 'selenium-webdriver';
import { Mockttp } from 'mockttp';
import { regularDelayMs, withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
import Homepage from '../../page-objects/pages/home/homepage';
import AccountListPage from '../../page-objects/pages/account-list-page';
import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';
import {
  mockBitcoinFeatureFlag,
  mockExchangeRates,
  mockInitialFullScan,
  mockRampsDynamicFeatureFlag,
  mockGetUtxos,
  mockGetBlocks,
  mockFeeEstimates,
  mockScripthashTxs,
  mockBlockHeight,
  mockGetUtxosMainnet,
  mockFeeEstimatesMainnet,
  mockGetTxHex,
  mockGetTxHexMainnet,
  mockScripthashTxs2,
  mockBlockHeight0,
  mockBlockHeight931551,
} from '../../tests/btc/mocks';
import { WalletConnectionType } from '../../page-objects/pages/test-dapp-bitcoin';
import {
  DAPP_PATH,
  DEFAULT_BTC_ADDRESS,
  SECONDARY_BTC_ADDRESS,
} from '../../constants';
import {
  mockPriceMulti,
  mockPriceMultiBtcAndSol,
} from '../../tests/btc/mocks/min-api';

export type FixtureCallbackArgs = { driver: Driver; extensionId: string };

export const account1Short = `${DEFAULT_BTC_ADDRESS.slice(0, 4)}...${DEFAULT_BTC_ADDRESS.slice(-4)}`;
export const account2Short = `${SECONDARY_BTC_ADDRESS.slice(0, 4)}...${SECONDARY_BTC_ADDRESS.slice(-4)}`;
export const txHashShort = `f632...2f78`;

export const psbt =
  'cHNidP8BAHECAAAAAZWJ25B394BrSQ65wNtwny+qxXez2vsQvaUn8WZmUQyfAQAAAAD/////AugDAAAAAAAAFgAUsXnj+ePQhyHrPBWaQ1JhLV1m8ZyI1/UFAAAAABYAFEaddug4fhHL6QEMcu5LdI3ZFS+lAAAAAAABAMECAAAAAAEBEXLSQnkwax1H8e/6rJXmytghfvqDx4g5A/BcQMOVoo0NAAAAAP3///8CnggAAAAAAAAWABRGnXboOH4Ry+kBDHLuS3SN2RUvpQWBIAAAAAAAIlEg7RKe4I4bra27T+dfOEchNHnda5rSEGJZ1VIIkdl/aBABQHupG8m5wmhyVfotju/RGyhjuuPe62jlP9SNxoymBT4LXut008rusTtuTBY+g2so7BknoqBnLg9VuFhgkxTSpoUAAAAAAAAA';
export const signedPsbt =
  'cHNidP8BAFICAAAAAZWJ25B394BrSQ65wNtwny+qxXez2vsQvaUn8WZmUQyfAAAAAAD9////AegDAAAAAAAAFgAUsXnj+ePQhyHrPBWaQ1JhLV1m8ZweOQ4AAAEAwQIAAAAAAQERctJCeTBrHUfx7/qslebK2CF++oPHiDkD8FxAw5WijQ0AAAAA/f///wKeCAAAAAAAABYAFEaddug4fhHL6QEMcu5LdI3ZFS+lBYEgAAAAAAAiUSDtEp7gjhutrbtP5184RyE0ed1rmtIQYlnVUgiR2X9oEAFAe6kbybnCaHJV+i2O79EbKGO6497raOU/1I3GjKYFPgte63TTyu6xO25MFj6DayjsGSeioGcuD1W4WGCTFNKmhQAAAAABAR+eCAAAAAAAABYAFEaddug4fhHL6QEMcu5LdI3ZFS+lAQhrAkcwRAIgVWyBH9oT1hNh1507Ok9RfXQp38FYHWkoPTqHRzIV7nACIAFQ9uyWyKtN5UsvsJPlAzzqUxrN24SHg4ZBT7EwNsOtASECiiaVQFz2r+FkwS1s3Krps2Cvx5lTy12cD2pHssirOTYAAA==';

export const SIGNED_MESSAGES_MOCK: Record<WalletConnectionType, string> = {
  [WalletConnectionType.Standard]:
    '2724869233025221621920421093532286127255141612424720818615921381191207251442501586115313322589232701841211498526164118447506531691441452531632515054170854923516144217244138526413321383814964922461752251001934510822017023317996175199153832039315615106711782001715754',
  [WalletConnectionType.SatsConnectV3]:
    'AkgwRQIhAPzY28zSXTXkPRv/jT3yLxRRVp/VUb/PGZD6nj2ZheFZAiBGuHmVVRoQKbgvMgY1qZCR/aP7MjaqVTHroSzZ9Io0QAEhAoomlUBc9q/hZMEtbNyq6bNgr8eZU8tdnA9qR7LIqzk2',
  [WalletConnectionType.SatsConnectV4]: '',
};

/**
 * Default options for setting up Bitcoin E2E test environment
 */
export const DEFAULT_BITCOIN_TEST_DAPP_FIXTURE_OPTIONS = {
  dappOptions: {
    customDappPaths: [DAPP_PATH.TEST_DAPP_BITCOIN],
  },
};

export async function withBtcWalletStandardSnap(
  {
    title,
    dappOptions,
    numberOfAccounts = 1,
  }: {
    title?: string;
    dappOptions?: {
      numberOfTestDapps?: number;
      customDappPaths?: string[];
    };
    numberOfAccounts?: number;
  },
  test: (
    driver: Driver,
    mockServer?: Mockttp,
    extensionId?: string,
  ) => Promise<void>,
) {
  await withFixtures(
    {
      fixtures: new FixtureBuilder()
        .withEnabledNetworks({
          eip155: {
            '0x539': true,
          },
          bip122: {
            [MultichainNetworks.BITCOIN]: true,
            [MultichainNetworks.BITCOIN_TESTNET]: true,
            [MultichainNetworks.BITCOIN_SIGNET]: true,
          },
        })
        .build(),
      title,
      dapp: true,
      dappOptions: dappOptions ?? {
        numberOfTestDapps: 1,
        customDappPaths: [DAPP_PATH.TEST_DAPP_BITCOIN],
      },
      forceBip44Version: false,
      manifestFlags: {
        remoteFeatureFlags: {
          bitcoinAccounts: { enabled: true, minimumVersion: '13.6.0' },
          sendRedesign: { enabled: true },
        },
      },
      testSpecificMock: async (mockServer: Mockttp) => [
        await mockBitcoinFeatureFlag(mockServer),
        await mockInitialFullScan(mockServer),
        await mockExchangeRates(mockServer),

        await mockGetUtxos(mockServer),
        await mockGetBlocks(mockServer),
        await mockFeeEstimates(mockServer),
        await mockScripthashTxs(mockServer),
        await mockBlockHeight(mockServer),
        await mockBlockHeight0(mockServer),
        await mockBlockHeight931551(mockServer),
        await mockGetUtxosMainnet(mockServer),
        await mockFeeEstimatesMainnet(mockServer),
        await mockGetTxHex(mockServer),
        await mockGetTxHexMainnet(mockServer),
        await mockScripthashTxs2(mockServer),

        await mockRampsDynamicFeatureFlag(mockServer, 'api'),
        await mockRampsDynamicFeatureFlag(mockServer, 'uat-api'),
        await mockPriceMulti(mockServer),
        await mockPriceMultiBtcAndSol(mockServer),
      ],
    },
    async ({ driver, mockServer }: { driver: Driver; mockServer: Mockttp }) => {
      await login(driver);

      await driver.delay(regularDelayMs); // workaround to avoid flakiness

      const accountListPage = new AccountListPage(driver);
      const homepage = new Homepage(driver);
      await homepage.checkExpectedBalanceIsDisplayed();

      for (let i = 0; i < numberOfAccounts; i++) {
        if (i === 0) {
          await homepage.headerNavbar.openAccountMenu();
        }

        await accountListPage.checkPageIsLoaded();
        await accountListPage.addMultichainAccount();
      }

      await accountListPage.selectAccount('Account 1');

      await test(driver, mockServer);
    },
  );
}

/**
 * Waits for the Confirm button in the footer of a Bitcoin-specific modal to be clickable then clicks it.
 * Note: This function does not work for general purpose modals like connect/disconnect.
 *
 * @param driver
 */
export const clickConfirmButton = async (driver: Driver): Promise<void> => {
  await driver.clickElement({ text: 'Approve' });
};

/**
 * Clicks the Cancel button in the footer in a Bitcoin-specific modal.
 * Note: This function does not work for general purpose modals like connect/disconnect.
 *
 * @param driver
 */
export const clickCancelButton = async (driver: Driver): Promise<void> => {
  const footerButtons = await driver.findClickableElements(
    By.css('button.snap-ui-renderer__footer-button'),
  );
  const cancelButton = footerButtons[0];
  await cancelButton.click();
};

/**
 * Switches to the specified account in the account menu.
 *
 * @param driver
 * @param accountName
 */
export const switchToAccount = async (
  driver: Driver,
  accountName: string,
): Promise<void> => {
  const nonEvmHomepage = new NonEvmHomepage(driver);
  await nonEvmHomepage.checkPageIsLoaded();
  await nonEvmHomepage.headerNavbar.openAccountMenu();

  const accountListPage = new AccountListPage(driver);
  await accountListPage.checkPageIsLoaded();
  await accountListPage.checkAccountDisplayedInAccountList(accountName);
  await accountListPage.switchToAccount(accountName);
  await nonEvmHomepage.headerNavbar.checkAccountLabel(accountName);
  await nonEvmHomepage.checkPageIsLoaded();
};

enum ConnectionStatus {
  Connected = 'Connected',
  NotConnected = 'Not connected',
}

/**
 * Asserts that the connection status is as expected.
 *
 * @param connectionStatus
 * @param expectedAddress
 */
export const assertConnected = (
  connectionStatus: string,
  expectedAddress?: string,
): void => {
  assert.strictEqual(
    connectionStatus,
    expectedAddress ? `${expectedAddress}` : ConnectionStatus.Connected,
    `Connection status should be ${
      expectedAddress ? `"${expectedAddress}"` : ConnectionStatus.Connected
    }`,
  );
};

/**
 * Asserts that the connection status is "Not connected".
 *
 * @param connectionStatus
 */
export const assertDisconnected = (connectionStatus: string): void => {
  assert.strictEqual(
    connectionStatus,
    ConnectionStatus.NotConnected,
    `Connection status should be "${ConnectionStatus.NotConnected}"`,
  );
};
