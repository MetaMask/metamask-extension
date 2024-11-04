import { Mockttp } from 'mockttp';
import FixtureBuilder from '../../fixture-builder';
import { withFixtures, unlockWallet } from '../../helpers';
import {
  DEFAULT_SOLANA_ACCOUNT,
  DEFAULT_SOLANA_BALANCE,
} from '../../constants';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
import { Driver } from '../../webdriver/driver';
import messages from '../../../../app/_locales/en/messages.json';

export async function createSolanaAccount(driver: Driver) {
  await driver.clickElement('[data-testid="account-menu-icon"]');
  await driver.clickElement(
    '[data-testid="multichain-account-menu-popover-action-button"]',
  );
  await driver.clickElement({
    text: messages.addNewSolanaAccount.message,
    tag: 'button',
  });
  await driver.clickElementAndWaitToDisappear(
    {
      text: 'Add account',
      tag: 'button',
    },
    // Longer timeout than usual, this reduces the flakiness
    // around Bitcoin account creation (mainly required for
    // Firefox)
    5000,
  );
}

export async function mockSolanaBalanceQuote(
  mockServer: Mockttp,
  address: string = DEFAULT_SOLANA_ACCOUNT,
) {
  return await mockServer
    .forPost(/^https:\/\/.*\.btc.*\.quiknode\.pro(\/|$)/u)
    .withJsonBodyIncluding({
      method: 'bb_getaddress',
    })
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          result: {
            address,
            balance: (DEFAULT_SOLANA_BALANCE * 1e8).toString(), // Converts from BTC to sats
            totalReceived: '0',
            totalSent: '0',
            unconfirmedBalance: '0',
            unconfirmedTxs: 0,
            txs: 0,
          },
        },
      };
    });
}

export async function mockRampsDynamicFeatureFlag(
  mockServer: Mockttp,
  subDomain: string,
) {
  return await mockServer
    .forGet(
      `https://on-ramp-content.${subDomain}.cx.metamask.io/regions/networks`,
    )
    .withQuery({
      context: 'extension',
    })
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        networks: [
          {
            active: true,
            chainId: MultichainNetworks.SOLANA,
            chainName: 'Solana',
            shortName: 'Solana',
            nativeTokenSupported: true,
            isEvm: false,
          },
        ],
      },
    }));
}

export async function withSolanaAccountSnap(
  {
    title,
    solanaSupportEnabled,
  }: { title?: string; solanaSupportEnabled?: boolean },
  test: (driver: Driver) => Promise<void>,
) {
  await withFixtures(
    {
      fixtures: new FixtureBuilder()
        .withPreferencesControllerAndFeatureFlag({
          solanaSupportEnabled: solanaSupportEnabled ?? true,
        })
        .build(),
      title,
      dapp: true,
      testSpecificMock: async (mockServer: Mockttp) => [
        await mockSolanaBalanceQuote(mockServer),
        // See: PROD_RAMP_API_BASE_URL
        await mockRampsDynamicFeatureFlag(mockServer, 'api'),
        // See: UAT_RAMP_API_BASE_URL
        await mockRampsDynamicFeatureFlag(mockServer, 'uat-api'),
      ],
    },
    async ({ driver }: { driver: Driver }) => {
      await unlockWallet(driver);
      await createSolanaAccount(driver);
      await test(driver);
    },
  );
}
