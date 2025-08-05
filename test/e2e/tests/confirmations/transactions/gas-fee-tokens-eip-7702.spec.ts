import { Suite } from 'mocha';
import { MockttpServer } from 'mockttp';
import { Anvil } from '@viem/anvil';
import { CHAIN_IDS } from '@metamask/transaction-controller';
import { Driver } from '../../../webdriver/driver';
import FixtureBuilder from '../../../fixture-builder';
import { WINDOW_TITLES, unlockWallet, withFixtures } from '../../../helpers';
import { toggleStxSetting } from '../../../page-objects/flows/toggle-stx-setting.flow';
import { createDappTransaction } from '../../../page-objects/flows/transaction';
import TransactionConfirmation from '../../../page-objects/pages/confirmations/redesign/transaction-confirmation';
import GasFeeTokenModal from '../../../page-objects/pages/confirmations/redesign/gas-fee-token-modal';
import ActivityListPage from '../../../page-objects/pages/home/activity-list';
import HomePage from '../../../page-objects/pages/home/homepage';
import { TX_SENTINEL_URL } from '../../../../../shared/constants/transaction';
import { mockEip7702FeatureFlag } from '../helpers';
import { RelayStatus } from '../../../../../app/scripts/lib/transaction/transaction-relay';

const UUID = '1234-5678';
const TRANSACTION_HASH =
  '0xf25183af3bf64af01e9210201a2ede3c1dcd6d16091283152d13265242939fc4';

describe('Gas Fee Tokens - EIP-7702', function (this: Suite) {
  it('confirms transaction if successful', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder({ inputChainId: CHAIN_IDS.MAINNET })
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        localNodeOptions: {
          hardfork: 'prague',
          loadState:
            './test/e2e/seeder/network-states/eip7702-state/withUpgradedAccount.json',
        },
        testSpecificMock: (mockServer: MockttpServer) => {
          mockSimulationResponse(mockServer);
          mockEip7702FeatureFlag(mockServer);
          mockTransactionRelayNetworks(mockServer);
          mockTransactionRelaySubmit(mockServer);
          mockTransactionRelayStatus(mockServer);
          mockSmartTransactionFeatureFlags(mockServer);
        },
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver; localNodes: Anvil }) => {
        await unlockWallet(driver);

        // disable smart transactions step by step
        // we cannot use fixtures because migration 135 overrides the opt in value to true
        await toggleStxSetting(driver);

        await createDappTransaction(driver);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const transactionConfirmation = new TransactionConfirmation(driver);
        await transactionConfirmation.clickAdvancedDetailsButton();
        await transactionConfirmation.closeGasFeeToastMessage();
        await transactionConfirmation.clickGasFeeTokenPill();

        const gasFeeTokenModal = new GasFeeTokenModal(driver);
        await gasFeeTokenModal.check_AmountFiat('DAI', '$3.21');
        await gasFeeTokenModal.check_AmountToken('DAI', '3.21 DAI');
        await gasFeeTokenModal.check_Balance('DAI', '$10.00');

        await gasFeeTokenModal.check_AmountFiat('USDC', '$1.23');
        await gasFeeTokenModal.check_AmountToken('USDC', '1.23 USDC');
        await gasFeeTokenModal.check_Balance('USDC', '$5.00');
        await gasFeeTokenModal.clickToken('USDC');
        await transactionConfirmation.closeGasFeeToastMessage();

        await transactionConfirmation.check_gasFeeSymbol('USDC');
        await transactionConfirmation.check_gasFeeFiat('$1.23');
        await transactionConfirmation.check_gasFee('1.23');
        await transactionConfirmation.check_gasFeeTokenFee('$0.43');
        await transactionConfirmation.clickFooterConfirmButton();

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        const homepage = new HomePage(driver);
        await homepage.goToActivityList();

        const activityListPage = new ActivityListPage(driver);
        await activityListPage.check_confirmedTxNumberDisplayedInActivity(1);
      },
    );
  });

  it('fails transaction if error', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder({ inputChainId: CHAIN_IDS.MAINNET })
          .withPermissionControllerConnectedToTestDapp()
          .withNetworkControllerOnMainnet()
          .build(),
        localNodeOptions: {
          hardfork: 'prague',
          loadState:
            './test/e2e/seeder/network-states/eip7702-state/withUpgradedAccount.json',
        },
        testSpecificMock: (mockServer: MockttpServer) => {
          mockSimulationResponse(mockServer);
          mockEip7702FeatureFlag(mockServer);
          mockTransactionRelayNetworks(mockServer);
          mockTransactionRelaySubmit(mockServer);
          mockTransactionRelayStatus(mockServer, { success: false });
          mockSmartTransactionFeatureFlags(mockServer);
        },
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver; localNodes: Anvil }) => {
        await unlockWallet(driver);
        await createDappTransaction(driver);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const transactionConfirmation = new TransactionConfirmation(driver);
        await transactionConfirmation.closeGasFeeToastMessage();
        await transactionConfirmation.clickGasFeeTokenPill();

        const gasFeeTokenModal = new GasFeeTokenModal(driver);
        await gasFeeTokenModal.clickToken('USDC');
        await transactionConfirmation.closeGasFeeToastMessage();

        await transactionConfirmation.check_gasFeeSymbol('USDC');
        await transactionConfirmation.clickFooterConfirmButton();

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        const homepage = new HomePage(driver);
        await homepage.goToActivityList();

        const activityListPage = new ActivityListPage(driver);
        await activityListPage.check_failedTxNumberDisplayedInActivity(1);
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
                    tokenFees: [
                      {
                        token: {
                          address: '0x1234567890abcdef1234567890abcdef12345678',
                          decimals: 6,
                          symbol: 'USDC',
                        },
                        balanceNeededToken: '0x12C4B0',
                        currentBalanceToken: '0x4C4B40',
                        feeRecipient:
                          '0xBAB951a55b61dfAe21Ff7C3501142B397367F026',
                        rateWei: '0x216FF33813A80',
                      },
                      {
                        token: {
                          address: '0x01234567890abcdef1234567890abcdef1234567',
                          decimals: 3,
                          symbol: 'DAI',
                        },
                        balanceNeededToken: '0xC8A',
                        currentBalanceToken: '0x2710',
                        feeRecipient:
                          '0xBAB951a55b61dfAe21Ff7C3501142B397367F026',
                        rateWei: '0x216FF33813A80',
                      },
                    ],
                  },
                ],
                stateDiff: {},
                feeEstimate: 972988071597550,
                baseFeePerGas: 40482817574,
              },
            ],
            blockNumber: '0x1293669',
            id: 'faaab4c5-edf5-4077-ac75-8d26278ca2c5',
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
              status: success ? RelayStatus.Success : 'FAILED',
            },
          ],
        },
      };
    });
}

async function mockSmartTransactionFeatureFlags(mockServer: MockttpServer) {
  await mockServer
    .forGet('https://swap.api.cx.metamask.io/featureFlags')
    .thenCallback(() => {
      return {
        ok: true,
        statusCode: 200,
        json: {},
      };
    });
}
