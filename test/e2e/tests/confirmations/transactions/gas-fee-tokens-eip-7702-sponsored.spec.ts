import { SentinelSmartTransactionStatus } from '@metamask-previews/sentinel-api-service';
import { Suite } from 'mocha';
import { MockttpServer } from 'mockttp';
import { TX_SENTINEL_URL } from '../../../../../shared/constants/transaction';
import {
  DEFAULT_FIXTURE_ACCOUNT,
  DEFAULT_FIXTURE_ACCOUNT_ID,
  WINDOW_TITLES,
} from '../../../constants';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { convertETHToHexGwei, withFixtures } from '../../../helpers';
import { login } from '../../../page-objects/flows/login.flow';
import { createDappTransaction } from '../../../page-objects/flows/transaction.flow';
import TransactionConfirmation from '../../../page-objects/pages/confirmations/transaction-confirmation';
import ActivityTab from '../../../page-objects/pages/home/activity-tab';
import HomePage from '../../../page-objects/pages/home/homepage';
import { mockEip7702FeatureFlag } from '../helpers';
import { mockSpotPrices } from '../../tokens/utils/mocks';

const UUID = '1234-5678';
const TRANSACTION_HASH =
  '0xf25183af3bf64af01e9210201a2ede3c1dcd6d16091283152d13265242939fc4';
const MAINNET_NATIVE_ETH_BALANCE = '1';

describe('Gas Fee Tokens - EIP-7702 - Sponsored', function (this: Suite) {
  it('confirms transaction if successful', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .withPermissionControllerConnectedToTestDapp({ chainIds: [1] })
          .withSmartTransactionsOptedOut()
          .withAssetsController({
            assetsBalance: {
              [DEFAULT_FIXTURE_ACCOUNT_ID]: {
                'eip155:1/slip44:60': { amount: MAINNET_NATIVE_ETH_BALANCE },
              },
            },
          })
          .build(),
        localNodeOptions: {
          loadState:
            './test/e2e/seeder/network-states/eip7702-state/withUpgradedAccount.json',
        },
        unifiedEvmAccountsApiBalances: {
          mainnetNativeEthHuman: MAINNET_NATIVE_ETH_BALANCE,
        },
        testSpecificMock: (mockServer: MockttpServer) => {
          mockSimulationResponse(mockServer);
          mockEip7702FeatureFlag(mockServer);
          mockTransactionRelayNetworks(mockServer);
          mockTransactionRelaySubmit(mockServer);
          mockTransactionRelayStatus(mockServer);
          mockSmartTransactionFeatureFlags(mockServer);
          mockSpotPrices(mockServer, {
            'eip155:1/slip44:60': {
              price: 1700,
              marketCap: 382623505141,
              pricePercentChange1d: 0,
            },
          });
        },
        title: this.test?.fullTitle(),
      },
      async ({ driver, localNodes }) => {
        await localNodes?.[0]?.setAccountBalance(
          DEFAULT_FIXTURE_ACCOUNT,
          convertETHToHexGwei(1),
        );
        await login(driver, { expectedBalance: MAINNET_NATIVE_ETH_BALANCE });

        await createDappTransaction(driver);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const transactionConfirmation = new TransactionConfirmation(driver);
        await transactionConfirmation.checkPaidByMetaMask();

        await transactionConfirmation.clickAdvancedDetailsButton();

        await transactionConfirmation.checkPaidByMetaMask();
        await transactionConfirmation.clickFooterConfirmButtonAndAndWaitForWindowToClose();

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        const homepage = new HomePage(driver);
        await homepage.goToActivityList();

        const activityTab = new ActivityTab(driver);
        await activityTab.checkConfirmedTxNumberDisplayedInActivity(1);
      },
    );
  });

  it('fails transaction if error', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .withPermissionControllerConnectedToTestDapp({ chainIds: [1] })
          .withAssetsController({
            assetsBalance: {
              [DEFAULT_FIXTURE_ACCOUNT_ID]: {
                'eip155:1/slip44:60': { amount: MAINNET_NATIVE_ETH_BALANCE },
              },
            },
          })
          .build(),
        localNodeOptions: {
          loadState:
            './test/e2e/seeder/network-states/eip7702-state/withUpgradedAccount.json',
        },
        unifiedEvmAccountsApiBalances: {
          mainnetNativeEthHuman: MAINNET_NATIVE_ETH_BALANCE,
        },
        testSpecificMock: (mockServer: MockttpServer) => {
          mockSimulationResponse(mockServer);
          mockEip7702FeatureFlag(mockServer);
          mockTransactionRelayNetworks(mockServer);
          mockTransactionRelaySubmit(mockServer);
          mockTransactionRelayStatus(mockServer, { success: false });
          mockSmartTransactionFeatureFlags(mockServer);
          mockSpotPrices(mockServer, {
            'eip155:1/slip44:60': {
              price: 1700,
              marketCap: 382623505141,
              pricePercentChange1d: 0,
            },
          });
        },
        title: this.test?.fullTitle(),
      },
      async ({ driver, localNodes }) => {
        await localNodes?.[0]?.setAccountBalance(
          DEFAULT_FIXTURE_ACCOUNT,
          convertETHToHexGwei(1),
        );
        await login(driver, { expectedBalance: MAINNET_NATIVE_ETH_BALANCE });
        await createDappTransaction(driver);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const transactionConfirmation = new TransactionConfirmation(driver);

        await transactionConfirmation.clickFooterConfirmButtonAndAndWaitForWindowToClose();

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        const homepage = new HomePage(driver);
        await homepage.goToActivityList();

        const activityTab = new ActivityTab(driver);
        await activityTab.checkFailedTxNumberDisplayedInActivity(1);
      },
    );
  });
});

async function mockSimulationResponse(mockServer: MockttpServer) {
  await mockServer
    .forPost(TX_SENTINEL_URL)
    .withBodyIncluding('simulateTransactions')
    .thenCallback(() => {
      return {
        ok: true,
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          result: {
            transactions: [
              {
                return:
                  '0x0000000000000000000000000000000000000000000000000000000000000000',
                status: '0x1',
                gasUsed: '0x5de2',
                gasLimit: '0x5f34',
                fees: [
                  {
                    maxFeePerGas: '0xf19b9f48d',
                    maxPriorityFeePerGas: '0x9febc9',
                    balanceNeeded: '0x59d9d3b865ed8',
                    currentBalance: '0x77f9fd8d99e7e0',
                    error: '',
                    tokenFees: [],
                  },
                ],
                stateDiff: {},
                feeEstimate: 972988071597550,
                baseFeePerGas: 40482817574,
              },
            ],
            blockNumber: '0x1293669',
            id: 'faaab4c5-edf5-4077-ac75-8d26278ca2c5',
            sponsorship: { isSponsored: true },
          },
        },
      };
    });
}

async function mockTransactionRelayNetworks(mockServer: MockttpServer) {
  await mockServer
    .forGet(`${TX_SENTINEL_URL}/networks`)
    .always()
    .thenCallback(() => {
      return {
        ok: true,
        statusCode: 200,
        json: {
          '1': {
            network: 'ethereum-mainnet',
            confirmations: true,
            relayTransactions: true,
            sendBundle: true,
          },
        },
      };
    });
}

async function mockTransactionRelaySubmit(mockServer: MockttpServer) {
  await mockServer
    .forPost(TX_SENTINEL_URL)
    .withBodyIncluding('eth_sendRelayTransaction')
    .thenCallback(() => {
      return {
        ok: true,
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          result: {
            uuid: UUID,
          },
        },
      };
    });
}

async function mockTransactionRelayStatus(
  mockServer: MockttpServer,
  { success }: { success?: boolean } = { success: true },
) {
  await mockServer
    .forGet(`${TX_SENTINEL_URL}/smart-transactions/${UUID}`)
    .thenCallback(() => {
      return {
        ok: true,
        statusCode: 200,
        json: {
          transactions: [
            {
              hash: TRANSACTION_HASH,
              status: success
                ? SentinelSmartTransactionStatus.Validated
                : SentinelSmartTransactionStatus.Failed,
            },
          ],
        },
      };
    });
}

async function mockSmartTransactionFeatureFlags(mockServer: MockttpServer) {
  await mockServer
    .forGet('https://bridge.api.cx.metamask.io/featureFlags')
    .thenCallback(() => {
      return {
        ok: true,
        statusCode: 200,
        json: {},
      };
    });
}
