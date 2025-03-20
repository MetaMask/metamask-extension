import { ApprovalType } from '@metamask/controller-utils';
import { CHAIN_IDS } from '@metamask/transaction-controller';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import * as backgroundConnection from '../../../ui/store/background-connection';
import mockMetaMaskState from '../data/integration-init-state.json';
import { integrationTestRender } from '../../lib/render-helpers';
import preview from 'jest-preview';

jest.mock('../../../ui/store/background-connection', () => ({
  ...jest.requireActual('../../../ui/store/background-connection'),
  submitRequestToBackground: jest.fn(),
  callBackgroundMethod: jest.fn(),
}));

const mockedBackgroundConnection = jest.mocked(backgroundConnection);

const backgroundConnectionMocked = {
  onNotification: jest.fn(),
};

const getMetaMaskStateWithUnapprovedPersonalSign = (accountAddress: string) => {
  return {
    ...mockMetaMaskState,
    "smartTransactionsState": {
      "fees": {
        "approvalTxFees": null,
        "tradeTxFees": {
          "cancelFees": [],
          "return": "0x",
          "status": 1,
          "gasUsed": 190780,
          "gasLimit": 239420,
          "fees": [
            {
              "maxFeePerGas": 4667609171,
              "maxPriorityFeePerGas": 1000000004,
              "gas": 239420,
              "balanceNeeded": 1217518987960240,
              "currentBalance": 751982303082919400,
              "error": ""
            }
          ],
          "feeEstimate": 627603309182220,
          "baseFeePerGas": 2289670348,
          "maxFeeEstimate": 1117518987720820
        }
      },
      "feesByChainId": {
        "0x1": {
          "approvalTxFees": null,
          "tradeTxFees": {
            "cancelFees": [],
            "return": "0x",
            "status": 1,
            "gasUsed": 190780,
            "gasLimit": 239420,
            "fees": [
              {
                "maxFeePerGas": 4667609171,
                "maxPriorityFeePerGas": 1000000004,
                "gas": 239420,
                "balanceNeeded": 1217518987960240,
                "currentBalance": 751982303082919400,
                "error": ""
              }
            ],
            "feeEstimate": 627603309182220,
            "baseFeePerGas": 2289670348,
            "maxFeeEstimate": 1117518987720820
          }
        }
      },
      "liveness": true,
      "livenessByChainId": {
        "0x1": true
      },
      "smartTransactions": {
        "0x1": []
      }
    },
    "swapsState": {
      "quotes": {},
      "quotesPollingLimitEnabled": false,
      "fetchParams": null,
      "tokens": null,
      "tradeTxId": null,
      "approveTxId": null,
      "quotesLastFetched": null,
      "customMaxGas": "",
      "customGasPrice": null,
      "customMaxFeePerGas": null,
      "customMaxPriorityFeePerGas": null,
      "swapsUserFeeLevel": "",
      "selectedAggId": null,
      "customApproveTxData": "",
      "errorKey": "",
      "topAggId": null,
      "routeState": "",
      "swapsFeatureIsLive": true,
      "saveFetchedQuotes": false,
      "swapsQuoteRefreshTime": 30000,
      "swapsQuotePrefetchingRefreshTime": 30000,
      "swapsStxBatchStatusRefreshTime": 10000,
      "swapsStxStatusDeadline": 180,
      "swapsStxGetTransactionsRefreshTime": 10000,
      "swapsStxMaxFeeMultiplier": 2,
      "swapsFeatureFlags": {
        "ethereum": {
          "fallbackToV1": false,
          "mobileActive": true,
          "extensionActive": true
        },
        "bsc": {
          "fallbackToV1": false,
          "mobileActive": true,
          "extensionActive": true
        },
        "polygon": {
          "fallbackToV1": false,
          "mobileActive": true,
          "extensionActive": true
        },
        "avalanche": {
          "fallbackToV1": false,
          "mobileActive": true,
          "extensionActive": true
        },
        "smartTransactions": {
          "mobileActive": false,
          "extensionActive": true
        },
        "updated_at": "2022-03-17T15:54:00.360Z"
      }
    },
    "bridgeState": {
      "bridgeFeatureFlags": {
        "extensionConfig": {
          "refreshRate": 30,
          "maxRefreshCount": 5,
          "support": false,
          "chains": {
            "eip155:1": {
              "isActiveSrc": true,
              "isActiveDest": true
            },
            "eip155:42161": {
              "isActiveSrc": true,
              "isActiveDest": true
            },
            "eip155:59144": {
              "isActiveSrc": true,
              "isActiveDest": true
            }
          }
        }
      },
    },
  };
};

describe('Swaps Inauthentic Swap Alert', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('displays the alert', async () => {
    const account =
      mockMetaMaskState.internalAccounts.accounts[
        mockMetaMaskState.internalAccounts
          .selectedAccount as keyof typeof mockMetaMaskState.internalAccounts.accounts
      ];

    const accountName = account.metadata.name;
    const mockedMetaMaskState = getMetaMaskStateWithUnapprovedPersonalSign(
      account.address,
    );

    await act(async () => {
      await integrationTestRender({
        preloadedState: mockedMetaMaskState,
        backgroundConnection: backgroundConnectionMocked,
      });
    });
    await screen.findByText(accountName);

    await act(async () => {
      fireEvent.click(
        await screen.findByTestId('prepare-swap-page-from-token-amount'),
      );
    });



    const alert = await screen.findByTestId('swaps-banner-title');
    expect(alert).toBeInTheDocument();

    screen.debug();
  });
});
