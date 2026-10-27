/**
 * Ink native Max send (WPN-1797 bug #5).
 *
 * Max-sending native ETH on Ink used to submit the full balance, so Activity
 * failed or stayed pending. This checks that confirmation reserves gas and
 * Activity shows a confirmed Sent row. The decimal-string chain id path
 * (bug #10) is covered separately.
 * Anvil is the chain. Mockttp covers gas, token, and price HTTP only.
 */

import {
  type NetworkConfiguration,
  NetworkStatus,
  RpcEndpointType,
} from '@metamask/network-controller';
import { MockttpServer } from 'mockttp';
import {
  CHAIN_IDS,
  INK_DISPLAY_NAME,
} from '../../../../shared/constants/network';
import { GAS_API_BASE_URL } from '../../../../shared/constants/swaps';
import { GasEstimateTypes } from '../../../../shared/constants/gas';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import {
  DEFAULT_FIXTURE_ACCOUNT,
  DEFAULT_FIXTURE_ACCOUNT_ID,
} from '../../constants';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import { mockEthPrices } from '../tokens/utils/mocks';
import HomePage from '../../page-objects/pages/home/homepage';
import SendPage from '../../page-objects/pages/send/send-page';
import TransactionConfirmation from '../../page-objects/pages/confirmations/transaction-confirmation';
import ActivityTab from '../../page-objects/pages/home/activity-tab';
import { Driver } from '../../webdriver/driver';

const INK_DECIMAL_CHAIN_ID = '57073';
const INK_NATIVE_ASSET_ID = 'eip155:57073/slip44:60';
const INK_CLIENT_ID = 'ink';
const ANVIL_BALANCE_HEX = '0x15af1d78b58c40000';
const ANVIL_BALANCE_ETH = '25';
const ETH_USD_PRICE = 1700;
const RECIPIENT_ADDRESS = '0x2f318C334780961FB129D2a6c30D0763d9a5C970';

const ETH_NATIVE_INFO = {
  aggregators: [],
  decimals: 18,
  image: '',
  name: 'Ethereum',
  symbol: 'ETH',
  type: 'native' as const,
};

const ASSETS_PRICE_ETH = {
  assetPriceType: 'fungible' as const,
  id: 'ethereum',
  lastUpdated: 0,
  price: ETH_USD_PRICE,
  usdPrice: ETH_USD_PRICE,
};

// Fees are high enough that reserving gas moves the confirmation heading
// below 25. A normal ~20 gwei fee is smaller than the heading's rounding
// step, so "24.999 ETH" is shown as "25 ETH".
const INK_SUGGESTED_GAS_FEES = {
  low: {
    suggestedMaxPriorityFeePerGas: '100',
    suggestedMaxFeePerGas: '1000',
    minWaitTimeEstimate: 15000,
    maxWaitTimeEstimate: 30000,
  },
  medium: {
    suggestedMaxPriorityFeePerGas: '100',
    suggestedMaxFeePerGas: '1000',
    minWaitTimeEstimate: 15000,
    maxWaitTimeEstimate: 45000,
  },
  high: {
    suggestedMaxPriorityFeePerGas: '100',
    suggestedMaxFeePerGas: '1000',
    minWaitTimeEstimate: 15000,
    maxWaitTimeEstimate: 60000,
  },
  estimatedBaseFee: '900',
  networkCongestion: 0.14685,
  latestPriorityFeeRange: ['100', '100'],
  historicalPriorityFeeRange: ['100', '100'],
  historicalBaseFeeRange: ['900', '900'],
  priorityFeeTrend: 'down',
  baseFeeTrend: 'up',
};

const INK_CHAIN_GAS_FEE_STATE = {
  estimatedGasFeeTimeBounds: {},
  gasEstimateType: GasEstimateTypes.feeMarket,
  gasFeeEstimates: INK_SUGGESTED_GAS_FEES,
};

const NATIVE_ACCOUNT_BALANCE = {
  [DEFAULT_FIXTURE_ACCOUNT]: {
    balance: ANVIL_BALANCE_HEX,
    stakedBalance: '0x0',
  },
};

/**
 * Ink network entry for hex chain id `0xdef1`.
 *
 * @returns Network configuration selected by the fixture.
 */
function inkNetworkConfiguration(): NetworkConfiguration {
  return {
    blockExplorerUrls: ['https://explorer.inkonchain.com'],
    chainId: CHAIN_IDS.INK,
    defaultBlockExplorerUrlIndex: 0,
    defaultRpcEndpointIndex: 0,
    name: INK_DISPLAY_NAME,
    nativeCurrency: 'ETH',
    rpcEndpoints: [
      {
        networkClientId: INK_CLIENT_ID,
        type: RpcEndpointType.Custom,
        url: 'http://localhost:8545',
      },
    ],
  };
}

/**
 * Builds the Ink fixture. Fee estimates are seeded before the send because
 * native Max reads them by exact key and does not wait for a gas poll.
 * The gas API itself is keyed by the decimal network id `57073`.
 *
 * @returns Fixture state for the hex Ink max-send flow.
 */
function buildInkFixture() {
  return new FixtureBuilderV2()
    .withNetworkController({
      selectedNetworkClientId: INK_CLIENT_ID,
      networkConfigurationsByChainId: {
        [CHAIN_IDS.INK]: inkNetworkConfiguration(),
      },
      networksMetadata: {
        [INK_CLIENT_ID]: {
          EIPS: { 1559: true },
          status: NetworkStatus.Available,
        },
      },
    })
    .withEnabledNetworks({
      eip155: { [CHAIN_IDS.INK]: true },
    })
    .withAccountTracker({
      accountsByChainId: {
        [CHAIN_IDS.INK]: NATIVE_ACCOUNT_BALANCE,
      },
    })
    .withAssetsController({
      assetsInfo: {
        [INK_NATIVE_ASSET_ID]: ETH_NATIVE_INFO,
      },
      assetsBalance: {
        [DEFAULT_FIXTURE_ACCOUNT_ID]: {
          [INK_NATIVE_ASSET_ID]: { amount: ANVIL_BALANCE_ETH },
        },
      },
      assetsPrice: {
        'eip155:1/slip44:60': ASSETS_PRICE_ETH,
        [INK_NATIVE_ASSET_ID]: ASSETS_PRICE_ETH,
      },
    })
    .withGasFeeController({
      gasEstimateType: GasEstimateTypes.feeMarket,
      gasFeeEstimates: INK_SUGGESTED_GAS_FEES,
      gasFeeEstimatesByChainId: {
        [CHAIN_IDS.INK]: INK_CHAIN_GAS_FEE_STATE,
        [INK_DECIMAL_CHAIN_ID]: INK_CHAIN_GAS_FEE_STATE,
      },
    })
    .build();
}

/**
 * Mocks Ink gas, token, and ETH price HTTP. The gas API route uses the decimal
 * network id for every chain.
 *
 * @param mockServer - Mockttp server for this test.
 */
async function mockInkApis(mockServer: MockttpServer): Promise<void> {
  await mockServer
    .forGet(
      `${GAS_API_BASE_URL}/networks/${INK_DECIMAL_CHAIN_ID}/suggestedGasFees`,
    )
    .asPriority(99)
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: INK_SUGGESTED_GAS_FEES,
    }));

  await mockServer
    .forGet(`https://token.api.cx.metamask.io/tokens/${INK_DECIMAL_CHAIN_ID}`)
    .asPriority(99)
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: [],
    }));

  await mockEthPrices(mockServer, ETH_USD_PRICE, [CHAIN_IDS.INK]);
}

/**
 * Sends the full native balance and checks confirmation reserved gas and Activity.
 *
 * @param driver - WebDriver for the extension.
 */
async function sendInkNativeMax(driver: Driver): Promise<void> {
  await login(driver, { validateBalance: false });

  const homePage = new HomePage(driver);
  await homePage.checkPageIsLoaded();
  await homePage.checkSendButtonIsClickable();
  await homePage.startSendFlow();

  const sendPage = new SendPage(driver);
  await sendPage.checkPageIsLoaded();
  await sendPage.selectToken(CHAIN_IDS.INK, 'ETH');
  await sendPage.fillRecipient({ recipientAddress: RECIPIENT_ADDRESS });
  await sendPage.clickMaxButton();
  await sendPage.pressContinueButton();

  const transactionConfirmation = new TransactionConfirmation(driver);
  await transactionConfirmation.checkPageIsLoaded();
  await transactionConfirmation.checkNativeMaxAmountBelowBalance(
    ANVIL_BALANCE_ETH,
  );
  await transactionConfirmation.clickScrollToBottomButton();
  await transactionConfirmation.clickFooterButton({
    button: 'confirm',
    waitUntil: 'disappear',
  });

  await homePage.checkPageIsLoaded();
  await homePage.goToActivityList();

  const activityTab = new ActivityTab(driver);
  await activityTab.checkTransactionActivityByText('Sent');
  await activityTab.checkConfirmedTxNumberDisplayedInActivity(1);
  await activityTab.checkNoFailedTransactions();
  await activityTab.checkNoPendingTransactions();
}

describe('Send Ink native max', function () {
  it('sends the max native balance on hex chain id 0xdef1', async function () {
    await withFixtures(
      {
        fixtures: buildInkFixture(),
        localNodeOptions: { chainId: 57073, hardfork: 'london' },
        title: this.test?.fullTitle(),
        testSpecificMock: mockInkApis,
      },
      async ({ driver }) => {
        await sendInkNativeMax(driver);
      },
    );
  });
});
