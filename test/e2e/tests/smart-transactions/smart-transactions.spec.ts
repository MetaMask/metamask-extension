import { MockttpServer } from 'mockttp';
import {
  buildQuote,
  reviewQuote,
  checkActivityTransaction,
} from '../swaps/shared';
import FixtureBuilder from '../../fixture-builder';
import { unlockWallet, withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { mockSwapRequests } from './mock-requests-for-swap-test';

export async function withFixturesForSmartTransactions(
  {
    title,
    testSpecificMock,
  }: {
    title?: string;
    testSpecificMock: (mockServer: MockttpServer) => Promise<void>;
  },
  test: (args: { driver: Driver }) => Promise<void>,
) {
  const inputChainId = CHAIN_IDS.MAINNET;
  await withFixtures(
    {
      fixtures: new FixtureBuilder({ inputChainId })
        .withPermissionControllerConnectedToTestDapp()
        .withPreferencesControllerSmartTransactionsOptedIn()
        .withNetworkControllerOnMainnet()
        .build(),
      title,
      testSpecificMock,
      dapp: true,
    },
    async ({ driver }) => {
      await unlockWallet(driver);
      await test({ driver });
    },
  );
}

export const waitForTransactionToComplete = async (
  driver: Driver,
  options: { tokenName: string },
) => {
  await driver.waitForSelector({
    css: '[data-testid="swap-smart-transaction-status-header"]',
    text: 'Privately submitting your Swap',
  });

  await driver.waitForSelector(
    {
      css: '[data-testid="swap-smart-transaction-status-header"]',
      text: 'Swap complete!',
    },
    { timeout: 30000 },
  );

  await driver.findElement({
    css: '[data-testid="swap-smart-transaction-status-description"]',
    text: `${options.tokenName}`,
  });

  await driver.clickElement({ text: 'Close', tag: 'button' });
  await driver.waitForSelector('[data-testid="account-overview__asset-tab"]');
};

describe('smart transactions @no-mmi', function () {
  it('Completes a Swap', async function () {
    await withFixturesForSmartTransactions(
      {
        title: this.test?.fullTitle(),
        testSpecificMock: mockSwapRequests,
      },
      async ({ driver }) => {
        await buildQuote(driver, {
          amount: 2,
          swapTo: 'DAI',
        });
        await reviewQuote(driver, {
          amount: 2,
          swapFrom: 'ETH',
          swapTo: 'DAI',
        });

        await driver.clickElement({ text: 'Swap', tag: 'button' });
        await waitForTransactionToComplete(driver, { tokenName: 'DAI' });
        await checkActivityTransaction(driver, {
          index: 0,
          amount: '2',
          swapFrom: 'ETH',
          swapTo: 'DAI',
        });
      },
    );
  });
});
