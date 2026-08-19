/**
 * Send Ink native ETH using Max.
 *
 * Covers:
 * - Ink (0xdef1) Max send confirming and showing in Activity
 * - Decimal-string chainId send path (57073) merged from EXT-9
 */

import { strict as assert } from 'assert';
import { NetworkStatus, RpcEndpointType } from '@metamask/network-controller';
import type { MockedEndpoint, Mockttp } from 'mockttp';
import {
  CHAIN_IDS,
  INK_DISPLAY_NAME,
} from '../../../../shared/constants/network';
import { GAS_API_BASE_URL } from '../../../../shared/constants/swaps';
import {
  DEFAULT_FIXTURE_ACCOUNT,
  DEFAULT_FIXTURE_ACCOUNT_ID,
} from '../../constants';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import ActivityTab from '../../page-objects/pages/home/activity-tab';
import HomePage from '../../page-objects/pages/home/homepage';
import SendPage from '../../page-objects/pages/send/send-page';
import TransactionConfirmation from '../../page-objects/pages/confirmations/transaction-confirmation';
import { Driver } from '../../webdriver/driver';

const INK_CHAIN_ID_HEX = CHAIN_IDS.INK;
const INK_CHAIN_ID_DECIMAL = 57073;
const INK_NATIVE_ASSET_ID = `eip155:${INK_CHAIN_ID_DECIMAL}/slip44:60`;
/** Default Anvil account balance (25 ETH) in wei. */
const ANVIL_DEFAULT_BALANCE = '0x15af1d78b58c40000';
const DEFAULT_RECIPIENT = '0x2f318C334780961FB129D2a6c30D0763d9a5C970';
const INK_NETWORK_CLIENT_ID = 'ink';

const INK_NATIVE_INFO = {
  aggregators: [],
  decimals: 18,
  image: '',
  name: 'Ethereum',
  symbol: 'ETH',
  type: 'native' as const,
};

const INK_SUGGESTED_GAS_FEES = {
  low: {
    suggestedMaxPriorityFeePerGas: '1',
    suggestedMaxFeePerGas: '20.44436136',
    minWaitTimeEstimate: 15000,
    maxWaitTimeEstimate: 30000,
  },
  medium: {
    suggestedMaxPriorityFeePerGas: '1.5',
    suggestedMaxFeePerGas: '25.80554517',
    minWaitTimeEstimate: 15000,
    maxWaitTimeEstimate: 45000,
  },
  high: {
    suggestedMaxPriorityFeePerGas: '2',
    suggestedMaxFeePerGas: '27.277766977',
    minWaitTimeEstimate: 15000,
    maxWaitTimeEstimate: 60000,
  },
  estimatedBaseFee: '19.444436136',
  networkCongestion: 0.14685,
  latestPriorityFeeRange: ['0.378818859', '6.555563864'],
  historicalPriorityFeeRange: ['0.1', '248.262969261'],
  historicalBaseFeeRange: ['14.146999781', '28.825256275'],
  priorityFeeTrend: 'down',
  baseFeeTrend: 'up',
};

const TOKEN_CHAIN_ID_CASES = [
  { label: 'hex', tokenChainId: INK_CHAIN_ID_HEX },
  { label: 'decimal-string', tokenChainId: String(INK_CHAIN_ID_DECIMAL) },
] as const;

function buildInkFixtures(): ReturnType<FixtureBuilderV2['build']> {
  return new FixtureBuilderV2()
    .withNetworkController({
      selectedNetworkClientId: INK_NETWORK_CLIENT_ID,
      networkConfigurationsByChainId: {
        [INK_CHAIN_ID_HEX]: {
          blockExplorerUrls: ['https://explorer.inkonchain.com'],
          chainId: INK_CHAIN_ID_HEX,
          defaultBlockExplorerUrlIndex: 0,
          defaultRpcEndpointIndex: 0,
          name: INK_DISPLAY_NAME,
          nativeCurrency: 'ETH',
          rpcEndpoints: [
            {
              networkClientId: INK_NETWORK_CLIENT_ID,
              type: RpcEndpointType.Custom,
              url: 'http://localhost:8545',
            },
          ],
        },
      },
      networksMetadata: {
        [INK_NETWORK_CLIENT_ID]: {
          EIPS: { 1559: true },
          status: NetworkStatus.Available,
        },
      },
    })
    .withEnabledNetworks({
      eip155: {
        [INK_CHAIN_ID_HEX]: true,
      },
    })
    .withAccountTracker({
      accountsByChainId: {
        [INK_CHAIN_ID_HEX]: {
          [DEFAULT_FIXTURE_ACCOUNT]: {
            balance: ANVIL_DEFAULT_BALANCE,
            stakedBalance: '0x0',
          },
        },
      },
    })
    .withAssetsController({
      assetsInfo: {
        [INK_NATIVE_ASSET_ID]: INK_NATIVE_INFO,
      },
      assetsBalance: {
        [DEFAULT_FIXTURE_ACCOUNT_ID]: {
          [INK_NATIVE_ASSET_ID]: { amount: '25' },
        },
      },
    })
    .build();
}

async function mockInkApis(mockServer: Mockttp): Promise<MockedEndpoint[]> {
  const suggestedGasFees = await mockServer
    .forGet(
      `${GAS_API_BASE_URL}/networks/${INK_CHAIN_ID_DECIMAL}/suggestedGasFees`,
    )
    .asPriority(99)
    .always()
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: INK_SUGGESTED_GAS_FEES,
      };
    });

  await mockServer
    .forGet(`https://token.api.cx.metamask.io/tokens/${INK_CHAIN_ID_DECIMAL}`)
    .always()
    .thenCallback(() => {
      return { statusCode: 200, json: [] };
    });

  return [suggestedGasFees];
}

async function selectInkNativeToken(
  driver: Driver,
  sendPage: SendPage,
  tokenChainId: string,
): Promise<void> {
  const preferredToken = { testId: `token-asset-${tokenChainId}-ETH` };
  const hexFallbackToken = { testId: `token-asset-${INK_CHAIN_ID_HEX}-ETH` };

  await sendPage.checkPageIsLoaded();
  await driver.waitUntil(
    async () => {
      return (
        (await driver.isElementPresent(preferredToken)) ||
        (await driver.isElementPresent(hexFallbackToken))
      );
    },
    { interval: 100, timeout: 15000 },
  );

  if (await driver.isElementPresent(preferredToken)) {
    await sendPage.selectToken(tokenChainId, 'ETH');
    return;
  }

  await sendPage.selectToken(INK_CHAIN_ID_HEX, 'ETH');
}

async function assertMaxAmountDoesNotExceedBalanceMinusGas(
  driver: Driver,
  sendPage: SendPage,
): Promise<void> {
  await sendPage.waitForSendAmountBalance();
  await driver.waitUntil(
    async () => {
      const amount = parseFloat(await sendPage.getAmountInputValue());
      return amount > 0;
    },
    { interval: 100, timeout: 15000 },
  );
  await sendPage.waitForContinueButtonStablyEnabled();

  const availableBalance = await sendPage.getAvailableBalanceNumeric();
  const maxAmount = parseFloat(await sendPage.getAmountInputValue());

  assert.ok(
    Number.isFinite(availableBalance) && availableBalance > 0,
    `Available balance must be a positive number, got ${availableBalance}`,
  );
  assert.ok(
    Number.isFinite(maxAmount) && maxAmount > 0,
    `Max amount must be a positive number, got ${maxAmount}`,
  );
  assert.ok(
    maxAmount <= availableBalance,
    `Max amount ${maxAmount} must be <= available balance ${availableBalance}`,
  );
  assert.ok(
    maxAmount < availableBalance,
    `Max amount ${maxAmount} must reserve gas (available ${availableBalance})`,
  );
}

async function assertDecimalChainIdGasEstimatesWereRequested(
  mockedEndpoints: MockedEndpoint[],
): Promise<void> {
  const [suggestedGasFees] = mockedEndpoints;
  assert.ok(suggestedGasFees, 'Decimal chainId gas-fee mock was not registered');
  const requests = await suggestedGasFees.getSeenRequests();
  assert.ok(
    requests.length > 0,
    `Gas fee estimates must be requested with decimal chainId ${INK_CHAIN_ID_DECIMAL}`,
  );
}

describe('Send Ink native max', function () {
  TOKEN_CHAIN_ID_CASES.forEach(({ label, tokenChainId }) => {
    it(`sends native ETH using Max when token chainId is ${label}`, async function () {
      await withFixtures(
        {
          fixtures: buildInkFixtures(),
          localNodeOptions: {
            chainId: INK_CHAIN_ID_DECIMAL,
            hardfork: 'london',
          },
          title: this.test?.fullTitle(),
          testSpecificMock: mockInkApis,
        },
        async ({
          driver,
          mockedEndpoint,
        }: {
          driver: Driver;
          mockedEndpoint: MockedEndpoint[];
        }) => {
          await login(driver, { validateBalance: false });

          await driver.delay(1000);
          const homePage = new HomePage(driver);
          await homePage.startSendFlow();

          const sendPage = new SendPage(driver);
          await selectInkNativeToken(driver, sendPage, tokenChainId);
          await sendPage.fillRecipient({ recipientAddress: DEFAULT_RECIPIENT });
          await sendPage.clickMaxButton();
          await assertMaxAmountDoesNotExceedBalanceMinusGas(driver, sendPage);
          await sendPage.pressContinueButton();

          const transactionConfirmation = new TransactionConfirmation(driver);
          await transactionConfirmation.checkPageIsLoaded();
          await transactionConfirmation.clickFooterConfirmButtonAndWaitToDisappear();

          await homePage.goToActivityList();
          const activityTab = new ActivityTab(driver);
          await activityTab.checkTransactionActivityByText('Sent');
          await activityTab.checkConfirmedTxNumberDisplayedInActivity(1);
          await activityTab.checkNoFailedTransactions();
          await activityTab.checkNoPendingTransactions();

          await assertDecimalChainIdGasEstimatesWereRequested(mockedEndpoint);
        },
      );
    });
  });
});
