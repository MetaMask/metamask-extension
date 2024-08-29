import { act, fireEvent } from '@testing-library/react';
import { ApprovalType } from '@metamask/controller-utils';
import nock from 'nock';
import mockMetaMaskState from '../../data/integration-init-state.json';
import { integrationTestRender } from '../../../lib/render-helpers';
import * as backgroundConnection from '../../../../ui/store/background-connection';
import { createMockImplementation, mock4byte } from '../../helpers';
import { getUnapprovedApproveTransaction } from './transactionDataHelpers';

jest.mock('../../../../ui/store/background-connection', () => ({
  ...jest.requireActual('../../../../ui/store/background-connection'),
  submitRequestToBackground: jest.fn(),
  callBackgroundMethod: jest.fn(),
}));

const mockedBackgroundConnection = jest.mocked(backgroundConnection);

const backgroundConnectionMocked = {
  onNotification: jest.fn(),
};
export const pendingTransactionId = '48a75190-45ca-11ef-9001-f3886ec2397c';
export const pendingTransactionTime = new Date().getTime();

const getMetaMaskStateWithUnapprovedApproveTransaction = (
  accountAddress: string,
) => {
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
    knownMethodData: {
      '0x3b4b1381': {
        name: 'Mint NFTs',
        params: [
          {
            type: 'uint256',
          },
        ],
      },
    },
    transactions: [
      getUnapprovedApproveTransaction(
        accountAddress,
        pendingTransactionId,
        pendingTransactionTime,
      ),
    ],
  };
};

const setupSubmitRequestToBackgroundMocks = (
  mockRequests?: Record<string, unknown>,
) => {
  mockedBackgroundConnection.submitRequestToBackground.mockImplementation(
    createMockImplementation({
      ...(mockRequests ?? {}),
    }),
  );
};

describe('Contract Interaction Confirmation', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    setupSubmitRequestToBackgroundMocks();
    const APPROVE_NFT_HEX_SIG = '0x095ea7b3';
    mock4byte(APPROVE_NFT_HEX_SIG);
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('displays the alert when network is busy', async () => {
    const account =
      mockMetaMaskState.internalAccounts.accounts[
        mockMetaMaskState.internalAccounts
          .selectedAccount as keyof typeof mockMetaMaskState.internalAccounts.accounts
      ];

    const mockedMetaMaskState =
      getMetaMaskStateWithUnapprovedApproveTransaction(account.address);

    const { findByTestId, getByTestId, queryByTestId } =
      await integrationTestRender({
        preloadedState: {
          ...mockedMetaMaskState,
          gasFeeEstimatesByChainId: {
            '0x5': {
              gasFeeEstimates: {
                networkCongestion: 1.0005,
              },
            },
          },
        },
        backgroundConnection: backgroundConnectionMocked,
      });

    act(() => {
      fireEvent.click(getByTestId('inline-alert'));
    });

    expect(await findByTestId('alert-modal')).toBeInTheDocument();

    expect(
      await findByTestId('alert-modal__selected-alert'),
    ).toBeInTheDocument();

    expect(await findByTestId('alert-modal__selected-alert')).toHaveTextContent(
      'Gas prices are high and estimates are less accurate.',
    );

    expect(await findByTestId('alert-modal-button')).toBeInTheDocument();
    const alertModalConfirmButton = await findByTestId('alert-modal-button');

    act(() => {
      fireEvent.click(alertModalConfirmButton);
    });

    expect(queryByTestId('alert-modal')).not.toBeInTheDocument();
  });

  it('displays the alert when gas estimate fails', async () => {
    const account =
      mockMetaMaskState.internalAccounts.accounts[
        mockMetaMaskState.internalAccounts
          .selectedAccount as keyof typeof mockMetaMaskState.internalAccounts.accounts
      ];

    const mockedMetaMaskState =
      getMetaMaskStateWithUnapprovedApproveTransaction(account.address);

    const transactions = {
      ...mockedMetaMaskState.transactions[0],
      simulationFails: {
        reason: 'Internal JSON-RPC error.',
        debug: {
          blockNumber: '0x3a3c20d',
          blockGasLimit: '0x1c9c380',
        },
      },
    };

    const { findByTestId, getByTestId, queryByTestId } =
      await integrationTestRender({
        preloadedState: {
          ...mockedMetaMaskState,
          transactions: [transactions],
        },
        backgroundConnection: backgroundConnectionMocked,
      });

    act(() => {
      fireEvent.click(getByTestId('inline-alert'));
    });

    expect(await findByTestId('alert-modal')).toBeInTheDocument();

    expect(
      await findByTestId('alert-modal__selected-alert'),
    ).toBeInTheDocument();

    expect(await findByTestId('alert-modal__selected-alert')).toHaveTextContent(
      'We’re unable to provide an accurate fee and this estimate might be high. We suggest you to input a custom gas limit, but there’s a risk the transaction will still fail.',
    );

    expect(await findByTestId('alert-modal-button')).toBeInTheDocument();
    const alertModalConfirmButton = await findByTestId('alert-modal-button');

    act(() => {
      fireEvent.click(alertModalConfirmButton);
    });

    expect(queryByTestId('alert-modal')).not.toBeInTheDocument();
  });

  it('displays the alert for insufficient gas', async () => {
    const account =
      mockMetaMaskState.internalAccounts.accounts[
        mockMetaMaskState.internalAccounts
          .selectedAccount as keyof typeof mockMetaMaskState.internalAccounts.accounts
      ];

    const mockedMetaMaskState =
      getMetaMaskStateWithUnapprovedApproveTransaction(account.address);
    const transaction = mockedMetaMaskState.transactions[0];
    transaction.txParams.gas = '0x0';

    const { findByTestId, getByTestId } = await integrationTestRender({
      preloadedState: {
        ...mockedMetaMaskState,
        gasFeeEstimatesByChainId: {
          '0x5': {
            gasFeeEstimates: {
              networkCongestion: 0.0005,
            },
          },
        },
        transactions: [transaction],
      },
      backgroundConnection: backgroundConnectionMocked,
    });

    act(() => {
      fireEvent.click(getByTestId('inline-alert'));
    });

    expect(await findByTestId('alert-modal')).toBeInTheDocument();

    expect(
      await findByTestId('alert-modal__selected-alert'),
    ).toBeInTheDocument();

    expect(await findByTestId('alert-modal__selected-alert')).toHaveTextContent(
      'To continue with this transaction, you’ll need to increase the gas limit to 21000 or higher.',
    );

    expect(
      await findByTestId('alert-modal-action-showAdvancedGasModal'),
    ).toBeInTheDocument();
    expect(
      await findByTestId('alert-modal-action-showAdvancedGasModal'),
    ).toHaveTextContent('Update gas limit');
  });
});
