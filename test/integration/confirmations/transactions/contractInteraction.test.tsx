import { fireEvent, waitFor } from '@testing-library/react';
import { ApprovalType } from '@metamask/controller-utils';
import mockMetaMaskState from '../../data/integration-init-state.json';
import { integrationTestRender } from '../../../lib/render-helpers';
import { shortenAddress } from '../../../../ui/helpers/utils/util';
import * as backgroundConnection from '../../../../ui/store/background-connection';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsEventLocation,
} from '../../../../shared/constants/metametrics';
import { MESSAGE_TYPE } from '../../../../shared/constants/app';

jest.mock('../../../../ui/store/background-connection', () => ({
  ...jest.requireActual('../../../../ui/store/background-connection'),
  submitRequestToBackground: jest.fn(),
}));

const mockedBackgroundConnection = jest.mocked(backgroundConnection);

const backgroundConnectionMocked = {
  onNotification: jest.fn(),
};

const getMetaMaskStateWithUnapprovedContractInteraction = (accountAddress: string) => {
  const pendingTransactionId = '48a75190-45ca-11ef-9001-f3886ec2397c';
  const transactionAdded = `transaction-added-${pendingTransactionId}`
  const pendingTransactionTime = new Date().getTime();
  return {
    ...mockMetaMaskState,
    preferences: {
      ...mockMetaMaskState.preferences,
      redesignedConfirmationsEnabled: true,
    },
    pendingApprovals: {
      [pendingTransactionId]: {
        id: pendingTransactionId,
        origin: 'origin',
        time: pendingTransactionTime,
        type: ApprovalType.Transaction,
        requestData: {
          txId: pendingTransactionId,
        },
        requestState: null,
        expectsResult: false,
      },
    },
    pendingApprovalCount: 1,
    "fragments": {
      transactionAdded : {
        "id": transactionAdded,
        "category": "Transactions",
        "initialEvent": "Transaction Added",
        "successEvent": "Transaction Approved",
        "failureEvent": "Transaction Rejected",
        "properties": {
          "chain_id": "0x5",
          "referrer": "https://metamask.github.io",
          "source": "dapp",
          "status": "unapproved",
          "network": "11155111",
          "eip_1559_version": "2",
          "gas_edit_type": "none",
          "gas_edit_attempted": "none",
          "gas_estimation_failed": false,
          "account_type": "MetaMask",
          "asset_type": "NFT",
          "token_standard": "ERC721",
          "transaction_type": "contractInteraction",
          "transaction_speed_up": false,
          "security_alert_reason": "validation_in_progress",
          "security_alert_response": "loading",
          "ui_customizations": null,
          "is_smart_transaction": false,
          "simulation_response": "balance_change",
          "simulation_receiving_assets_petname": [
            "unknown"
          ],
          "simulation_receiving_assets_quantity": 1,
          "simulation_receiving_assets_type": [
            "erc721"
          ],
          "simulation_receiving_assets_value": [
            "not_available"
          ],
          "simulation_sending_assets_petname": [],
          "simulation_sending_assets_quantity": 0,
          "simulation_sending_assets_type": [],
          "simulation_sending_assets_value": [],
          "simulation_latency": 0.58
        },
        "sensitiveProperties": {
          "transaction_envelope_type": "fee-market",
          "first_seen": pendingTransactionTime,
          "gas_limit": "0x16a92",
          "transaction_contract_method": "Mint N F Ts",
          "max_fee_per_gas": "53.623782082",
          "max_priority_fee_per_gas": "1.5",
          "default_estimate": "medium",
          "default_max_fee_per_gas": "53.623782082",
          "default_max_priority_fee_per_gas": "1.5",
          "default_gas": "0.000092818",
          "chain_id": "0x5",
          "referrer": "https://metamask.github.io",
          "source": "dapp",
          "status": "unapproved",
          "network": "11155111",
          "eip_1559_version": "2",
          "gas_edit_type": "none",
          "gas_edit_attempted": "none",
          "gas_estimation_failed": false,
          "account_type": "MetaMask",
          "asset_type": "NFT",
          "token_standard": "ERC721",
          "transaction_type": "contractInteraction",
          "transaction_speed_up": false,
          "security_alert_reason": "validation_in_progress",
          "security_alert_response": "loading",
          "ui_customizations": null,
          "is_smart_transaction": false
        },
        "uniqueIdentifier": transactionAdded,
        "persist": true,
        "lastUpdated": pendingTransactionTime
      }
    },
    transactions: [
      {
        "actionId": 4256525906,
        "chainId": "0x5",
        "dappSuggestedGasFees": {
            "gas": "0x16a92"
        },
        "id": pendingTransactionId,
        "origin": 'origin',
        "securityAlertResponse": {},
        "status": "unapproved",
        "time": pendingTransactionTime,
        "txParams": {
            "from": accountAddress,
            "data": "0x3b4b13810000000000000000000000000000000000000000000000000000000000000001",
            "gas": "0x16a92",
            "to": "0x076146c765189d51be3160a2140cf80bfc73ad68",
            "value": "0x0",
            "maxFeePerGas": "0x5b06b0c0d",
            "maxPriorityFeePerGas": "0x59682f00"
        },
        "userEditedGasLimit": false,
        "verifiedOnBlockchain": false,
        "type": "contractInteraction",
        "networkClientId": "sepolia",
        "defaultGasEstimates": {
            "gas": "0x16a92",
            "maxFeePerGas": "0x5b06b0c0d",
            "maxPriorityFeePerGas": "0x59682f00",
            "estimateType": "medium"
        },
        "userFeeLevel": "medium",
        "sendFlowHistory": [],
        "history": [
            {
                "actionId": 4256525906,
                "chainId": "0x5",
                "dappSuggestedGasFees": {
                    "gas": "0x16a92"
                },
                "id": pendingTransactionId,
                "origin": "https://metamask.github.io",
                "securityAlertResponse": {},
                "status": "unapproved",
                "time": pendingTransactionTime,
                "txParams": {
                    "from": accountAddress,
                    "data": "0x3b4b13810000000000000000000000000000000000000000000000000000000000000001",
                    "gas": "0x16a92",
                    "to": "0x076146c765189d51be3160a2140cf80bfc73ad68",
                    "value": "0x0",
                    "maxFeePerGas": "0x5b06b0c0d",
                    "maxPriorityFeePerGas": "0x59682f00"
                },
                "userEditedGasLimit": false,
                "verifiedOnBlockchain": false,
                "type": "contractInteraction",
                "networkClientId": "sepolia",
                "defaultGasEstimates": {
                    "gas": "0x16a92",
                    "maxFeePerGas": "0x5b06b0c0d",
                    "maxPriorityFeePerGas": "0x59682f00",
                    "estimateType": "medium"
                },
                "userFeeLevel": "medium",
                "sendFlowHistory": []
            },
            [
                {
                    "op": "add",
                    "path": "/simulationData",
                    "value": {
                        "tokenBalanceChanges": [
                            {
                                "address": "0x076146c765189d51be3160a2140cf80bfc73ad68",
                                "standard": "erc721",
                                "id": "0x01",
                                "previousBalance": "0x0",
                                "newBalance": "0x1",
                                "difference": "0x1",
                                "isDecrease": false
                            }
                        ]
                    },
                    "note": "TransactionController#updateSimulationData - Update simulation data",
                    "timestamp": pendingTransactionTime
                },
                {
                    "op": "add",
                    "path": "/gasFeeEstimates",
                    "value": {
                        "type": "fee-market",
                        "low": {
                            "maxFeePerGas": "0x430349d26",
                            "maxPriorityFeePerGas": "0x3b9aca00"
                        },
                        "medium": {
                            "maxFeePerGas": "0x5b06b0c0d",
                            "maxPriorityFeePerGas": "0x59682f00"
                        },
                        "high": {
                            "maxFeePerGas": "0x730a17af4",
                            "maxPriorityFeePerGas": "0x77359400"
                        }
                    }
                },
                {
                    "op": "add",
                    "path": "/gasFeeEstimatesLoaded",
                    "value": true
                }
            ],
            [
                {
                    "op": "replace",
                    "path": "/securityAlertResponse/reason",
                    "value": "",
                    "note": "TransactionController:updatesecurityAlertResponse - securityAlertResponse updated",
                    "timestamp": pendingTransactionTime
                },
                {
                    "op": "replace",
                    "path": "/securityAlertResponse/result_type",
                    "value": "Benign"
                },
                {
                    "op": "add",
                    "path": "/securityAlertResponse/block",
                    "value": 6338995
                },
                {
                    "op": "add",
                    "path": "/securityAlertResponse/description",
                    "value": ""
                },
                {
                    "op": "add",
                    "path": "/securityAlertResponse/features",
                    "value": []
                },
                {
                    "op": "add",
                    "path": "/securityAlertResponse/providerRequestsCount",
                    "value": {
                        "eth_getBlockByNumber": 1,
                        "eth_getBalance": 4,
                        "debug_traceCall": 1,
                        "eth_getTransactionCount": 3,
                        "eth_getCode": 3,
                        "trace_call": 1,
                        "eth_createAccessList": 1,
                        "eth_getStorageAt": 3,
                        "eth_call": 2
                    }
                },
                {
                    "op": "add",
                    "path": "/securityAlertResponse/source",
                    "value": "local"
                }
            ]
        ],
        "simulationData": {
            "tokenBalanceChanges": [
                {
                    "address": "0x076146c765189d51be3160a2140cf80bfc73ad68",
                    "standard": "erc721",
                    "id": "0x01",
                    "previousBalance": "0x0",
                    "newBalance": "0x1",
                    "difference": "0x1",
                    "isDecrease": false
                }
            ]
        },
        "gasFeeEstimates": {
            "type": "fee-market",
            "low": {
                "maxFeePerGas": "0x451632798",
                "maxPriorityFeePerGas": "0x3b9aca00"
            },
            "medium": {
                "maxFeePerGas": "0x5dd36ad5a",
                "maxPriorityFeePerGas": "0x59682f00"
            },
            "high": {
                "maxFeePerGas": "0x7690a331c",
                "maxPriorityFeePerGas": "0x77359400"
            }
        },
        "gasFeeEstimatesLoaded": true
    }
    ],
    "completeTxList": [
      {
        "actionId": 4256525913,
        "chainId": "0x5",
        "dappSuggestedGasFees": {
          "gas": "0x16a92"
        },
        "id": pendingTransactionId,
        "origin": 'origin',
        "securityAlertResponse": {
          "block": 6339125,
          "result_type": "Benign",
          "reason": "",
          "description": "",
          "features": [],
          "providerRequestsCount": {
            "eth_getBlockByNumber": 1,
            "eth_getBalance": 4,
            "debug_traceCall": 1,
            "eth_getTransactionCount": 3,
            "eth_getCode": 3,
            "trace_call": 1,
            "eth_createAccessList": 1,
            "eth_getStorageAt": 3,
            "eth_call": 2
          },
          "source": "local",
          "securityAlertId": "96e67b50-225e-40cc-97a8-5c9c29431584"
        },
        "status": "unapproved",
        "time": pendingTransactionTime,
        "txParams": {
          "from": accountAddress,
          "data": "0x3b4b13810000000000000000000000000000000000000000000000000000000000000001",
          "gas": "0x16a92",
          "to": "0x076146c765189d51be3160a2140cf80bfc73ad68",
          "value": "0x0",
          "maxFeePerGas": "0xc7c39fac2",
          "maxPriorityFeePerGas": "0x59682f00"
        },
        "userEditedGasLimit": false,
        "verifiedOnBlockchain": false,
        "type": "contractInteraction",
        "networkClientId": "sepolia",
        "defaultGasEstimates": {
          "gas": "0x16a92",
          "maxFeePerGas": "0xc7c39fac2",
          "maxPriorityFeePerGas": "0x59682f00",
          "estimateType": "medium"
        },
        "userFeeLevel": "medium",
        "sendFlowHistory": [],
        "history": [
          {
            "actionId": 4256525913,
            "chainId": "0x5",
            "dappSuggestedGasFees": {
              "gas": "0x16a92"
            },
            "id": pendingTransactionId,
            "origin": 'origin',
            "securityAlertResponse": {
              "result_type": "loading",
              "reason": "validation_in_progress",
              "securityAlertId": "96e67b50-225e-40cc-97a8-5c9c29431584"
            },
            "status": "unapproved",
            "time": pendingTransactionTime,
            "txParams": {
              "from": accountAddress,
              "data": "0x3b4b13810000000000000000000000000000000000000000000000000000000000000001",
              "gas": "0x16a92",
              "to": "0x076146c765189d51be3160a2140cf80bfc73ad68",
              "value": "0x0",
              "maxFeePerGas": "0xc7c39fac2",
              "maxPriorityFeePerGas": "0x59682f00"
            },
            "userEditedGasLimit": false,
            "verifiedOnBlockchain": false,
            "type": "contractInteraction",
            "networkClientId": "sepolia",
            "defaultGasEstimates": {
              "gas": "0x16a92",
              "maxFeePerGas": "0xc7c39fac2",
              "maxPriorityFeePerGas": "0x59682f00",
              "estimateType": "medium"
            },
            "userFeeLevel": "medium",
            "sendFlowHistory": []
          },
          [
            {
              "op": "add",
              "path": "/simulationData",
              "value": {
                "tokenBalanceChanges": [
                  {
                    "address": "0x076146c765189d51be3160a2140cf80bfc73ad68",
                    "standard": "erc721",
                    "id": "0x01",
                    "previousBalance": "0x0",
                    "newBalance": "0x1",
                    "difference": "0x1",
                    "isDecrease": false
                  }
                ]
              },
              "note": "TransactionController#updateSimulationData - Update simulation data",
              "timestamp": 1721394027405
            },
            {
              "op": "add",
              "path": "/gasFeeEstimates",
              "value": {
                "type": "fee-market",
                "low": {
                  "maxFeePerGas": "0x938f3d2b5",
                  "maxPriorityFeePerGas": "0x3b9aca00"
                },
                "medium": {
                  "maxFeePerGas": "0xc7c39fac2",
                  "maxPriorityFeePerGas": "0x59682f00"
                },
                "high": {
                  "maxFeePerGas": "0xfbf8022ce",
                  "maxPriorityFeePerGas": "0x77359400"
                }
              }
            },
            {
              "op": "add",
              "path": "/gasFeeEstimatesLoaded",
              "value": true
            }
          ],
          [
            {
              "op": "replace",
              "path": "/securityAlertResponse/reason",
              "value": "",
              "note": "TransactionController:updatesecurityAlertResponse - securityAlertResponse updated",
              "timestamp": 1721394027831
            },
            {
              "op": "replace",
              "path": "/securityAlertResponse/result_type",
              "value": "Benign"
            },
            {
              "op": "add",
              "path": "/securityAlertResponse/block",
              "value": 6339125
            },
            {
              "op": "add",
              "path": "/securityAlertResponse/description",
              "value": ""
            },
            {
              "op": "add",
              "path": "/securityAlertResponse/features",
              "value": []
            },
            {
              "op": "add",
              "path": "/securityAlertResponse/providerRequestsCount",
              "value": {
                "eth_getBlockByNumber": 1,
                "eth_getBalance": 4,
                "debug_traceCall": 1,
                "eth_getTransactionCount": 3,
                "eth_getCode": 3,
                "trace_call": 1,
                "eth_createAccessList": 1,
                "eth_getStorageAt": 3,
                "eth_call": 2
              }
            },
            {
              "op": "add",
              "path": "/securityAlertResponse/source",
              "value": "local"
            }
          ]
        ],
        "simulationData": {
          "tokenBalanceChanges": [
            {
              "address": "0x076146c765189d51be3160a2140cf80bfc73ad68",
              "standard": "erc721",
              "id": "0x01",
              "previousBalance": "0x0",
              "newBalance": "0x1",
              "difference": "0x1",
              "isDecrease": false
            }
          ]
        },
        "gasFeeEstimates": {
          "type": "fee-market",
          "low": {
            "maxFeePerGas": "0x938f3d2b5",
            "maxPriorityFeePerGas": "0x3b9aca00"
          },
          "medium": {
            "maxFeePerGas": "0xc7c39fac2",
            "maxPriorityFeePerGas": "0x59682f00"
          },
          "high": {
            "maxFeePerGas": "0xfbf8022ce",
            "maxPriorityFeePerGas": "0x77359400"
          }
        },
        "gasFeeEstimatesLoaded": true
      }
    ],
  };
};

describe('Contract Interaction Confirmation', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('displays the header account modal with correct data', async () => {
    const account =
      mockMetaMaskState.internalAccounts.accounts[
        mockMetaMaskState.internalAccounts
          .selectedAccount as keyof typeof mockMetaMaskState.internalAccounts.accounts
      ];

    const accountName = account.metadata.name;
    const mockedMetaMaskState = getMetaMaskStateWithUnapprovedContractInteraction(
      account.address,
    );

    const { getByTestId, queryByTestId } = await integrationTestRender({
      preloadedState: mockedMetaMaskState,
      backgroundConnection: backgroundConnectionMocked,
    });

    expect(getByTestId('header-account-name')).toHaveTextContent(accountName);
    expect(getByTestId('header-network-display-name')).toHaveTextContent(
      'Chain 5',
    );

    fireEvent.click(getByTestId('header-info__account-details-button'));

    await waitFor(() => {
      expect(
        getByTestId('confirmation-account-details-modal__account-name'),
      ).toBeInTheDocument();
    });

    expect(
      getByTestId('confirmation-account-details-modal__account-name'),
    ).toHaveTextContent(accountName);
    expect(getByTestId('address-copy-button-text')).toHaveTextContent(
      '0x0DCD5...3E7bc',
    );
    expect(
      getByTestId('confirmation-account-details-modal__account-balance'),
    ).toHaveTextContent('1.58271596ETH');

    let confirmAccountDetailsModalMetricsEvent;

    await waitFor(() => {
      confirmAccountDetailsModalMetricsEvent =
        mockedBackgroundConnection.submitRequestToBackground.mock.calls?.find(
          (call) => call[0] === 'trackMetaMetricsEvent',
        );
      expect(confirmAccountDetailsModalMetricsEvent?.[0]).toBe(
        'trackMetaMetricsEvent',
      );
    });

    expect(confirmAccountDetailsModalMetricsEvent?.[1]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: MetaMetricsEventCategory.Confirmations,
          event: MetaMetricsEventName.AccountDetailsOpened,
          properties: {
            action: 'Confirm Screen',
            location: MetaMetricsEventLocation.SignatureConfirmation,
            transaction_type: ApprovalType.Transaction,
          },
        }),
      ]),
    );

    fireEvent.click(
      getByTestId('confirmation-account-details-modal__close-button'),
    );

    await waitFor(() => {
      expect(
        queryByTestId('confirmation-account-details-modal__account-name'),
      ).not.toBeInTheDocument();
    });
  });
});
