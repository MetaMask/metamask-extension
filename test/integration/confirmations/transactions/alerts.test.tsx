import { randomUUID } from 'crypto';
import { ApprovalType } from '@metamask/controller-utils';
import { act, fireEvent, screen } from '@testing-library/react';
import nock from 'nock';
import { useAssetDetails } from '../../../../ui/pages/confirmations/hooks/useAssetDetails';
import * as backgroundConnection from '../../../../ui/store/background-connection';
import { integrationTestRender } from '../../../lib/render-helpers';
import { createTestProviderTools } from '../../../stub/provider';
import mockMetaMaskState from '../../data/integration-init-state.json';
import { createMockImplementation, mock4byte } from '../../helpers';
import { getUnapprovedApproveTransaction } from './transactionDataHelpers';

jest.mock('../../../../ui/store/background-connection', () => ({
  ...jest.requireActual('../../../../ui/store/background-connection'),
  submitRequestToBackground: jest.fn(),
  callBackgroundMethod: jest.fn(),
}));

jest.mock('../../../../ui/pages/confirmations/hooks/useAssetDetails', () => ({
  ...jest.requireActual(
    '../../../../ui/pages/confirmations/hooks/useAssetDetails',
  ),
  useAssetDetails: jest.fn().mockResolvedValue({
    decimals: '4',
  }),
}));

const mockedBackgroundConnection = jest.mocked(backgroundConnection);
const mockedAssetDetails = jest.mocked(useAssetDetails);

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
    },
    urlScanCache: {
      'malicious-site.com': {
        result: {
          domainName: 'malicious-site.com',
          recommendedAction: 'BLOCK',
        },
        timestamp: 1715136000000,
      },
      'suspicious-site.com': {
        result: {
          domainName: 'suspicious-site.com',
          recommendedAction: 'WARN',
        },
        timestamp: 1715136000000,
      },
      'verified-site.com': {
        result: {
          domainName: 'verified-site.com',
          recommendedAction: 'VERIFIED',
        },
        timestamp: 1715136000000,
      },
      'safe-site.com': {
        result: {
          domainName: 'safe-site.com',
          recommendedAction: 'NONE',
        },
        timestamp: 1715136000000,
      },
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

describe('Contract Interaction Confirmation Alerts', () => {
  beforeAll(() => {
    const { provider } = createTestProviderTools({
      networkId: 'sepolia',
      chainId: '0xaa36a7',
    });

    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    global.ethereumProvider = provider as any;
  });

  beforeEach(() => {
    jest.resetAllMocks();
    setupSubmitRequestToBackgroundMocks();
    const APPROVE_NFT_HEX_SIG = '0x095ea7b3';
    mock4byte(APPROVE_NFT_HEX_SIG);
    mockedAssetDetails.mockImplementation(() => ({
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      decimals: '4' as any,
    }));
  });

  afterEach(() => {
    nock.cleanAll();
  });

  afterAll(() => {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (global as any).ethereumProvider;
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

    await act(async () => {
      await integrationTestRender({
        preloadedState: {
          ...mockedMetaMaskState,
          transactions: [transactions],
        },
        backgroundConnection: backgroundConnectionMocked,
      });
    });

    fireEvent.click(await screen.findByTestId('inline-alert'));

    expect(await screen.findByTestId('alert-modal')).toBeInTheDocument();

    expect(
      await screen.findByTestId('alert-modal__selected-alert'),
    ).toBeInTheDocument();

    expect(
      await screen.findByTestId('alert-modal__selected-alert'),
    ).toHaveTextContent(
      'We’re unable to provide an accurate fee and this estimate might be high. We suggest you to input a custom gas limit, but there’s a risk the transaction will still fail.',
    );

    expect(await screen.findByTestId('alert-modal-button')).toBeInTheDocument();
    const alertModalConfirmButton =
      await screen.findByTestId('alert-modal-button');

    fireEvent.click(alertModalConfirmButton);

    expect(screen.queryByTestId('alert-modal')).not.toBeInTheDocument();
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

    await act(async () => {
      await integrationTestRender({
        preloadedState: {
          ...mockedMetaMaskState,
          transactions: [transaction],
        },
        backgroundConnection: backgroundConnectionMocked,
      });
    });

    fireEvent.click(await screen.findByTestId('inline-alert'));

    expect(await screen.findByTestId('alert-modal')).toBeInTheDocument();

    expect(
      await screen.findByTestId('alert-modal__selected-alert'),
    ).toBeInTheDocument();

    expect(
      await screen.findByTestId('alert-modal__selected-alert'),
    ).toHaveTextContent(
      'To continue with this transaction, you’ll need to increase the gas limit to 21000 or higher.',
    );

    expect(
      await screen.findByTestId('alert-modal-action-showAdvancedGasModal'),
    ).toBeInTheDocument();
    expect(
      await screen.findByTestId('alert-modal-action-showAdvancedGasModal'),
    ).toHaveTextContent('Update gas limit');
  });

  it('displays the alert for no gas price', async () => {
    const account =
      mockMetaMaskState.internalAccounts.accounts[
        mockMetaMaskState.internalAccounts
          .selectedAccount as keyof typeof mockMetaMaskState.internalAccounts.accounts
      ];

    const mockedMetaMaskState =
      getMetaMaskStateWithUnapprovedApproveTransaction(account.address);

    const transaction = mockedMetaMaskState.transactions[0];
    transaction.gasFeeEstimates.type = 'none';

    await act(async () => {
      await integrationTestRender({
        preloadedState: {
          ...mockedMetaMaskState,
          gasEstimateType: 'none',
          transactions: [transaction],
        },
        backgroundConnection: backgroundConnectionMocked,
      });
    });

    fireEvent.click(await screen.findByTestId('inline-alert'));

    expect(await screen.findByTestId('alert-modal')).toBeInTheDocument();

    expect(
      await screen.findByTestId('alert-modal__selected-alert'),
    ).toBeInTheDocument();

    expect(
      await screen.findByTestId('alert-modal__selected-alert'),
    ).toHaveTextContent(
      'We can’t move forward with this transaction until you manually update the fee.',
    );

    expect(
      await screen.findByTestId('alert-modal-action-showAdvancedGasModal'),
    ).toBeInTheDocument();
    expect(
      await screen.findByTestId('alert-modal-action-showAdvancedGasModal'),
    ).toHaveTextContent('Update fee');
  });

  it('displays the alert for pending transactions', async () => {
    const account =
      mockMetaMaskState.internalAccounts.accounts[
        mockMetaMaskState.internalAccounts
          .selectedAccount as keyof typeof mockMetaMaskState.internalAccounts.accounts
      ];

    const mockedMetaMaskState =
      getMetaMaskStateWithUnapprovedApproveTransaction(account.address);
    const unapprovedTransaction = mockedMetaMaskState.transactions[0];
    const submittedTransaction = getUnapprovedApproveTransaction(
      account.address,
      randomUUID(),
      pendingTransactionTime - 1000,
    );
    submittedTransaction.status = 'submitted';

    await act(async () => {
      await integrationTestRender({
        preloadedState: {
          ...mockedMetaMaskState,
          gasEstimateType: 'none',
          pendingApprovalCount: 2,
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
            [submittedTransaction.id]: {
              id: submittedTransaction.id,
              origin: 'origin',
              time: pendingTransactionTime - 1000,
              type: ApprovalType.Transaction,
              requestData: {
                txId: submittedTransaction.id,
              },
              requestState: null,
              expectsResult: false,
            },
          },
          transactions: [unapprovedTransaction, submittedTransaction],
        },
        backgroundConnection: backgroundConnectionMocked,
      });
    });

    expect(await screen.findByTestId('inline-alert')).toBeInTheDocument();

    fireEvent.click(await screen.findByTestId('inline-alert'));

    expect(await screen.findByTestId('alert-modal')).toBeInTheDocument();

    expect(
      await screen.findByTestId('alert-modal__selected-alert'),
    ).toBeInTheDocument();

    expect(
      await screen.findByTestId('alert-modal__selected-alert'),
    ).toHaveTextContent(
      "This transaction won't go through until a previous transaction is complete. Learn how to cancel or speed up a transaction.",
    );
  });

  it('displays the alert for gas fees too low', async () => {
    const account =
      mockMetaMaskState.internalAccounts.accounts[
        mockMetaMaskState.internalAccounts
          .selectedAccount as keyof typeof mockMetaMaskState.internalAccounts.accounts
      ];

    const mockedMetaMaskState =
      getMetaMaskStateWithUnapprovedApproveTransaction(account.address);

    const transaction = mockedMetaMaskState.transactions[0];
    transaction.defaultGasEstimates.estimateType = 'low';
    transaction.userFeeLevel = 'low';

    await act(async () => {
      await integrationTestRender({
        preloadedState: {
          ...mockedMetaMaskState,
          transactions: [transaction],
        },
        backgroundConnection: backgroundConnectionMocked,
      });
    });

    fireEvent.click(await screen.findByTestId('inline-alert'));

    expect(await screen.findByTestId('alert-modal')).toBeInTheDocument();

    expect(
      await screen.findByTestId('alert-modal__selected-alert'),
    ).toBeInTheDocument();

    expect(
      await screen.findByTestId('alert-modal__selected-alert'),
    ).toHaveTextContent(
      'When choosing a low fee, expect slower transactions and longer wait times. For faster transactions, choose Market or Aggressive fee options.',
    );

    expect(
      await screen.findByTestId('alert-modal-action-showGasFeeModal'),
    ).toBeInTheDocument();
    expect(
      await screen.findByTestId('alert-modal-action-showGasFeeModal'),
    ).toHaveTextContent('Update gas options');
  });

  it('displays the alert for signing and submitting alerts', async () => {
    const account =
      mockMetaMaskState.internalAccounts.accounts[
        mockMetaMaskState.internalAccounts
          .selectedAccount as keyof typeof mockMetaMaskState.internalAccounts.accounts
      ];

    const mockedMetaMaskState =
      getMetaMaskStateWithUnapprovedApproveTransaction(account.address);
    const unapprovedTransaction = mockedMetaMaskState.transactions[0];
    const signedTransaction = getUnapprovedApproveTransaction(
      account.address,
      randomUUID(),
      pendingTransactionTime - 1000,
    );
    signedTransaction.status = 'signed';

    await act(async () => {
      await integrationTestRender({
        preloadedState: {
          ...mockedMetaMaskState,
          gasEstimateType: 'none',
          pendingApprovalCount: 2,
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
            [signedTransaction.id]: {
              id: signedTransaction.id,
              origin: 'origin',
              time: pendingTransactionTime - 1000,
              type: ApprovalType.Transaction,
              requestData: {
                txId: signedTransaction.id,
              },
              requestState: null,
              expectsResult: false,
            },
          },
          transactions: [unapprovedTransaction, signedTransaction],
        },
        backgroundConnection: backgroundConnectionMocked,
      });
    });

    const alerts = await screen.findAllByTestId('confirm-banner-alert');

    expect(
      alerts.some((alert) =>
        alert.textContent?.includes(
          'A previous transaction is still being signed or submitted',
        ),
      ),
    ).toBe(true);

    expect(
      await screen.findByTestId('confirm-footer-button'),
    ).toBeInTheDocument();
    expect(await screen.findByTestId('confirm-footer-button')).toBeDisabled();
  });

  it('displays the alert for malicious origin trust signals', async () => {
    const account =
      mockMetaMaskState.internalAccounts.accounts[
        mockMetaMaskState.internalAccounts
          .selectedAccount as keyof typeof mockMetaMaskState.internalAccounts.accounts
      ];

    const maliciousOrigin = 'https://malicious-site.com';
    const mockedMetaMaskState =
      getMetaMaskStateWithUnapprovedApproveTransaction(account.address);

    mockedMetaMaskState.transactions[0].origin = maliciousOrigin;
    mockedMetaMaskState.pendingApprovals[pendingTransactionId].origin =
      maliciousOrigin;

    await act(async () => {
      await integrationTestRender({
        preloadedState: mockedMetaMaskState,
        backgroundConnection: backgroundConnectionMocked,
      });
    });

    fireEvent.click(await screen.findByTestId('inline-alert'));

    expect(await screen.findByTestId('alert-modal')).toBeInTheDocument();

    expect(
      await screen.findByTestId('alert-modal__selected-alert'),
    ).toBeInTheDocument();

    expect(
      await screen.findByTestId('alert-modal__selected-alert'),
    ).toHaveTextContent(
      'This has been identified as malicious. We recommend not interacting with this site.',
    );
  });

  it('displays the alert for suspicious origin trust signals', async () => {
    const account =
      mockMetaMaskState.internalAccounts.accounts[
        mockMetaMaskState.internalAccounts
          .selectedAccount as keyof typeof mockMetaMaskState.internalAccounts.accounts
      ];

    const suspiciousOrigin = 'https://suspicious-site.com';
    const mockedMetaMaskState =
      getMetaMaskStateWithUnapprovedApproveTransaction(account.address);

    mockedMetaMaskState.transactions[0].origin = suspiciousOrigin;
    mockedMetaMaskState.pendingApprovals[pendingTransactionId].origin =
      suspiciousOrigin;

    await act(async () => {
      await integrationTestRender({
        preloadedState: mockedMetaMaskState,
        backgroundConnection: backgroundConnectionMocked,
      });
    });

    fireEvent.click(await screen.findByTestId('inline-alert'));

    expect(await screen.findByTestId('alert-modal')).toBeInTheDocument();

    expect(
      await screen.findByTestId('alert-modal__selected-alert'),
    ).toBeInTheDocument();

    expect(
      await screen.findByTestId('alert-modal__selected-alert'),
    ).toHaveTextContent(
      'This has been identified as suspicious. We recommend not interacting with this site.',
    );
  });

  it('displays multiple alerts including origin trust signals', async () => {
    const account =
      mockMetaMaskState.internalAccounts.accounts[
        mockMetaMaskState.internalAccounts
          .selectedAccount as keyof typeof mockMetaMaskState.internalAccounts.accounts
      ];

    const maliciousOrigin = 'https://malicious-site.com';
    const mockedMetaMaskState =
      getMetaMaskStateWithUnapprovedApproveTransaction(account.address);

    const transaction = mockedMetaMaskState.transactions[0];
    transaction.origin = maliciousOrigin;
    transaction.defaultGasEstimates.estimateType = 'low';
    transaction.userFeeLevel = 'low';
    mockedMetaMaskState.pendingApprovals[pendingTransactionId].origin =
      maliciousOrigin;

    await act(async () => {
      await integrationTestRender({
        preloadedState: {
          ...mockedMetaMaskState,
          transactions: [transaction],
        },
        backgroundConnection: backgroundConnectionMocked,
      });
    });

    // Should have multiple inline alerts
    const alerts = await screen.findAllByTestId('inline-alert');
    expect(alerts.length).toBeGreaterThanOrEqual(2);

    // Click on the first alert to open modal
    fireEvent.click(alerts[0]);

    expect(await screen.findByTestId('alert-modal')).toBeInTheDocument();

    fireEvent.click(
      await screen.findByTestId('transaction-details-origin-row'),
    );

    expect(await screen.findByTestId('alert-modal')).toBeInTheDocument();

    expect(
      await screen.findByTestId('alert-modal__selected-alert'),
    ).toHaveTextContent(
      'This has been identified as malicious. We recommend not interacting with this site.',
    );

    fireEvent.click(await screen.findByTestId('alert-modal-next-button'));

    expect(
      await screen.findByTestId('alert-modal__selected-alert'),
    ).toHaveTextContent(
      'When choosing a low fee, expect slower transactions and longer wait times. For faster transactions, choose Market or Aggressive fee options.',
    );
  });

  it('does not display origin trust signal alert for verified sites', async () => {
    const account =
      mockMetaMaskState.internalAccounts.accounts[
        mockMetaMaskState.internalAccounts
          .selectedAccount as keyof typeof mockMetaMaskState.internalAccounts.accounts
      ];

    const verifiedOrigin = 'https://verified-site.com';
    const mockedMetaMaskState =
      getMetaMaskStateWithUnapprovedApproveTransaction(account.address);

    mockedMetaMaskState.transactions[0].origin = verifiedOrigin;
    mockedMetaMaskState.pendingApprovals[pendingTransactionId].origin =
      verifiedOrigin;

    await act(async () => {
      await integrationTestRender({
        preloadedState: mockedMetaMaskState,
        backgroundConnection: backgroundConnectionMocked,
      });
    });

    // Should not have any trust signal alerts for verified sites
    const alerts = screen.queryAllByTestId('inline-alert');
    if (alerts.length > 0) {
      fireEvent.click(alerts[0]);
      const alertTexts = screen.queryAllByText(/malicious|suspicious/iu);
      expect(alertTexts).toHaveLength(0);
    }
  });

  it('does not display origin trust signal alert for unknown/safe sites', async () => {
    const account =
      mockMetaMaskState.internalAccounts.accounts[
        mockMetaMaskState.internalAccounts
          .selectedAccount as keyof typeof mockMetaMaskState.internalAccounts.accounts
      ];

    const safeOrigin = 'https://safe-site.com';
    const mockedMetaMaskState =
      getMetaMaskStateWithUnapprovedApproveTransaction(account.address);

    mockedMetaMaskState.transactions[0].origin = safeOrigin;
    mockedMetaMaskState.pendingApprovals[pendingTransactionId].origin =
      safeOrigin;

    await act(async () => {
      await integrationTestRender({
        preloadedState: mockedMetaMaskState,
        backgroundConnection: backgroundConnectionMocked,
      });
    });

    // Should not have any trust signal alerts for safe sites
    const alerts = screen.queryAllByTestId('inline-alert');
    if (alerts.length > 0) {
      fireEvent.click(alerts[0]);
      const alertTexts = screen.queryAllByText(/malicious|suspicious/iu);
      expect(alertTexts).toHaveLength(0);
    }
  });
});
