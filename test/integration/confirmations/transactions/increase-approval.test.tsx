import { ApprovalType, ERC20 } from '@metamask/controller-utils';
import { act, screen } from '@testing-library/react';
import nock from 'nock';
import * as backgroundConnection from '../../../../ui/store/background-connection';
import { integrationTestRender } from '../../../lib/render-helpers';
import mockMetaMaskState from '../../data/integration-init-state.json';
import { createMockImplementation, mock4byte } from '../../helpers';
import { getUnapprovedIncreaseApprovalTransaction } from './transactionDataHelpers';

jest.mock('../../../../ui/store/background-connection', () => ({
  ...jest.requireActual('../../../../ui/store/background-connection'),
  submitRequestToBackground: jest.fn(),
}));

const mockedBackgroundConnection = jest.mocked(backgroundConnection);

const backgroundConnectionMocked = {
  onNotification: jest.fn(),
};

export const pendingTransactionId = '48a75190-45ca-11ef-9001-f3886ec2397c';
export const pendingTransactionTime = new Date().getTime();

const getMetaMaskStateWithUnapprovedIncreaseApprovalTransaction = () => {
  const account =
    mockMetaMaskState.internalAccounts.accounts[
      mockMetaMaskState.internalAccounts
        .selectedAccount as keyof typeof mockMetaMaskState.internalAccounts.accounts
    ];

  return {
    ...mockMetaMaskState,
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
      // eslint-disable-next-line @typescript-eslint/naming-convention
      '0xd73dd623': {
        name: 'increaseApproval',
        params: [
          {
            type: 'address',
          },
          {
            type: 'uint256',
          },
        ],
      },
    },
    transactions: [
      getUnapprovedIncreaseApprovalTransaction(
        account.address,
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
      getGasFeeTimeEstimate: {
        lowerTimeBound: new Date().getTime(),
        upperTimeBound: new Date().getTime(),
      },
      getNextNonce: '9',
      addKnownMethodData: {},
      ...mockRequests,
    }),
  );
};

describe('Legacy ERC-20 increaseApproval Confirmation (PSAFE-415)', () => {
  beforeAll(() => {
    global.ethereumProvider = {
      request: jest.fn(),
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
  });

  beforeEach(() => {
    jest.resetAllMocks();
    setupSubmitRequestToBackgroundMocks({
      getTokenStandardAndDetailsByChain: {
        standard: ERC20,
        decimals: '4',
      },
    });
    const INCREASE_APPROVAL_HEX_SIG = '0xd73dd623';
    const INCREASE_APPROVAL_TEXT_SIG = 'increaseApproval(address,uint256)';
    mock4byte(INCREASE_APPROVAL_HEX_SIG, INCREASE_APPROVAL_TEXT_SIG);
  });

  afterEach(() => {
    nock.cleanAll();
  });

  afterAll(() => {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (global as any).ethereumProvider;
  });

  it('renders a confirmation for legacy increaseApproval calldata', async () => {
    const mockedMetaMaskState =
      getMetaMaskStateWithUnapprovedIncreaseApprovalTransaction();

    await act(async () => {
      await integrationTestRender({
        preloadedState: mockedMetaMaskState,
        backgroundConnection: backgroundConnectionMocked,
      });
    });

    expect(
      await screen.findByRole('button', { name: /confirm/iu }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('button', { name: /cancel/iu }),
    ).toBeInTheDocument();
  });
});
