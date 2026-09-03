/**
 * Send Ink native ETH using Max.
 *
 * Covers:
 * - Ink (`0xdef1`) Max send confirming and showing in Activity
 * - Decimal chainId `57073` on the gas-estimate API (EXT-9 / #39806)
 *
 * The send token picker renders `token-asset-${hexChainId}-ETH`. A decimal
 * `token-asset-57073-ETH` row is not produced, so this spec selects the hex
 * asset and asserts the decimal gas-fee URL instead of falling back.
 */

import { strict as assert } from 'assert';
import { NetworkStatus, RpcEndpointType } from '@metamask/network-controller';
import type { MockedEndpoint, Mockttp } from 'mockttp';
import { GasEstimateTypes } from '../../../../shared/constants/gas';
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
const INK_CHAIN_ID_DECIMAL_STRING = String(INK_CHAIN_ID_DECIMAL);
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

const INK_GAS_FEE_STATE = {
  gasFeeEstimates: INK_SUGGESTED_GAS_FEES,
  gasEstimateType: GasEstimateTypes.feeMarket,
  estimatedGasFeeTimeBounds: {},
};

function buildInkFixtures(): ReturnType<FixtureBuilderV2['build']> {
  // Send Max reads `gasFeeEstimatesByChainId` and does not start polling, so
  // estimates must already be present or Max fills the full balance.
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
    .withGasFeeController({
      gasEstimateType: GasEstimateTypes.feeMarket,
      gasFeeEstimates: INK_SUGGESTED_GAS_FEES,
      gasFeeEstimatesByChainId: {
        [INK_CHAIN_ID_HEX]: INK_GAS_FEE_STATE,
        [INK_CHAIN_ID_DECIMAL_STRING]: INK_GAS_FEE_STATE,
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

async function assertDecimalChainIdGasEstimatesWereRequested(
  driver: Driver,
  mockedEndpoints: MockedEndpoint[],
): Promise<void> {
  const [suggestedGasFees] = mockedEndpoints;
  assert.ok(
    suggestedGasFees,
    'Decimal chainId gas-fee mock was not registered',
  );
  await driver.waitUntil(
    async () => {
      const requests = await suggestedGasFees.getSeenRequests();
      return requests.length > 0;
    },
    { interval: 200, timeout: 15000 },
  );
}

describe('Send Ink native max', function () {
  it('sends native ETH using Max when token chainId is hex', async function () {
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

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.checkSendButtonIsClickable();
        await homePage.startSendFlow();

        const sendPage = new SendPage(driver);
        await sendPage.checkPageIsLoaded();
        await sendPage.selectToken(INK_CHAIN_ID_HEX, 'ETH');
        await sendPage.fillRecipient({ recipientAddress: DEFAULT_RECIPIENT });
        await sendPage.clickMaxButton();
        await sendPage.checkMaxAmountReservesGas();
        await sendPage.pressContinueButton();

        const transactionConfirmation = new TransactionConfirmation(driver);
        await transactionConfirmation.checkPageIsLoaded();
        await assertDecimalChainIdGasEstimatesWereRequested(
          driver,
          mockedEndpoint,
        );
        await transactionConfirmation.clickScrollToBottomButton();
        await transactionConfirmation.clickFooterConfirmButton();
        await homePage.checkPageIsLoaded();

        await homePage.goToActivityList();
        const activityTab = new ActivityTab(driver);
        await activityTab.checkTransactionActivityByText('Sent');
        await activityTab.checkConfirmedTxNumberDisplayedInActivity(1);
        await activityTab.checkNoFailedTransactions();
        await activityTab.checkNoPendingTransactions();
      },
    );
  });
});
