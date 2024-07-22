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
import nock from 'nock';
import { createMockImplementation, mock4byte } from '../../helpers';
import { TransactionType } from '@metamask/transaction-controller';

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
    "knownMethodData": {
      "0x3b4b1381": {
        "name": "Mint N F Ts",
        "params": [
          {
            "type": "uint256"
          }
        ]
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
      "type": TransactionType.contractInteraction,
      "networkClientId": "sepolia",
      "defaultGasEstimates": {
        "gas": "0x16a92",
        "maxFeePerGas": "0x5b06b0c0d",
        "maxPriorityFeePerGas": "0x59682f00",
        "estimateType": "medium"
      },
      "userFeeLevel": "medium",
      "sendFlowHistory": [],
      "history": [],
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
  };
};

describe('Contract Interaction Confirmation', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mock4byte();
      mockedBackgroundConnection.submitRequestToBackground.mockImplementation(
        createMockImplementation('getGasFeeTimeEstimate', { lowerTimeBound: new Date().getTime(), upperTimeBound: new Date().getTime()}),
      );
  });

  afterEach(() => { nock.cleanAll(); });

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
            location: MetaMetricsEventLocation.Transaction,
            transaction_type: TransactionType.contractInteraction,
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
