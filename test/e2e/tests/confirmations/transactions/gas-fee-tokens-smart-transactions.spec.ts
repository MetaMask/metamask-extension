import { Suite } from 'mocha';
import { MockttpServer } from 'mockttp';
import { Anvil } from '@viem/anvil';
import { CHAIN_IDS } from '@metamask/transaction-controller';
import { Driver } from '../../../webdriver/driver';
import FixtureBuilder from '../../../fixture-builder';
import { WINDOW_TITLES, unlockWallet, withFixtures } from '../../../helpers';
import { createDappTransaction } from '../../../page-objects/flows/transaction';
import TransactionConfirmation from '../../../page-objects/pages/confirmations/redesign/transaction-confirmation';
import GasFeeTokenModal from '../../../page-objects/pages/confirmations/redesign/gas-fee-token-modal';
import { mockSmartTransactionBatchRequests } from '../../smart-transactions/mocks';
import ActivityListPage from '../../../page-objects/pages/home/activity-list';
import HomePage from '../../../page-objects/pages/home/homepage';
import { TX_SENTINEL_URL } from '../../../../../shared/constants/transaction';

const TRANSACTION_HASH =
  '0xf25183af3bf64af01e9210201a2ede3c1dcd6d16091283152d13265242939fc4';

const TRANSACTION_HASH_2 =
  '0x62700f83ba1bbc29004bf7aef71ed0ea735de4fd59861b4235200d8fa028281f';

describe('Gas Fee Tokens - Smart Transactions', function (this: Suite) {
  it('confirms two transactions if successful', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder({ inputChainId: CHAIN_IDS.MAINNET })
          .withPermissionControllerConnectedToTestDapp()
          .withNetworkControllerOnMainnet()
          .build(),
        localNodeOptions: {
          hardfork: 'london',
        },
        testSpecificMock: (mockServer: MockttpServer) => {
          mockSimulationResponse(mockServer);
          mockSmartTransactionBatchRequests(mockServer, {
            transactionHashes: [TRANSACTION_HASH, TRANSACTION_HASH_2],
          });
          mockSentinelNetworks(mockServer);
        },
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver; localNodes: Anvil }) => {
        await unlockWallet(driver);
        await createDappTransaction(driver);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const transactionConfirmation = new TransactionConfirmation(driver);
        await transactionConfirmation.clickAdvancedDetailsButton();
        await transactionConfirmation.clickGasFeeTokenPill();

        const gasFeeTokenModal = new GasFeeTokenModal(driver);
        await gasFeeTokenModal.checkAmountFiat('DAI', '$3.21');
        await gasFeeTokenModal.checkAmountToken('DAI', '3.21 DAI');
        await gasFeeTokenModal.checkBalance('DAI', '$10.00');

        await gasFeeTokenModal.checkAmountFiat('USDC', '$1.23');
        await gasFeeTokenModal.checkAmountToken('USDC', '1.23 USDC');
        await gasFeeTokenModal.checkBalance('USDC', '$5.00');
        await gasFeeTokenModal.clickToken('USDC');

        await transactionConfirmation.checkGasFeeSymbol('USDC');
        await transactionConfirmation.checkGasFeeFiat('$1.23');
        await transactionConfirmation.checkGasFee('1.23');
        await transactionConfirmation.checkGasFeeTokenFee('$0.43');
        await transactionConfirmation.clickFooterConfirmButton();

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        const homepage = new HomePage(driver);
        await homepage.goToActivityList();

        const activityListPage = new ActivityListPage(driver);
        await activityListPage.checkConfirmedTxNumberDisplayedInActivity(2);
      },
    );
  });

  it('fails two transactions if error', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder({ inputChainId: CHAIN_IDS.MAINNET })
          .withPermissionControllerConnectedToTestDapp()
          .withNetworkControllerOnMainnet()
          .build(),
        localNodeOptions: {
          hardfork: 'london',
        },
        testSpecificMock: (mockServer: MockttpServer) => {
          mockSimulationResponse(mockServer);
          mockSmartTransactionBatchRequests(mockServer, {
            transactionHashes: [TRANSACTION_HASH, TRANSACTION_HASH_2],
            error: true,
          });
          mockSentinelNetworks(mockServer);
        },
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver; localNodes: Anvil }) => {
        await unlockWallet(driver);
        await createDappTransaction(driver);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const transactionConfirmation = new TransactionConfirmation(driver);
        await transactionConfirmation.clickGasFeeTokenPill();

        const gasFeeTokenModal = new GasFeeTokenModal(driver);
        await gasFeeTokenModal.clickToken('USDC');

        await transactionConfirmation.checkGasFeeSymbol('USDC');
        await transactionConfirmation.clickFooterConfirmButton();

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        const homepage = new HomePage(driver);
        await homepage.goToActivityList();

        const activityListPage = new ActivityListPage(driver);
        await activityListPage.checkFailedTxNumberDisplayedInActivity(2);
      },
    );
  });
});

async function mockSimulationResponse(mockServer: MockttpServer) {
  return [
    await mockServer.forPost(TX_SENTINEL_URL).thenCallback(() => {
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
    }),
  ];
}

async function mockSentinelNetworks(mockServer: MockttpServer) {
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
