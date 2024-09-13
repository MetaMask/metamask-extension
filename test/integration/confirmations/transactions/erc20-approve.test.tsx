import { ApprovalType } from '@metamask/controller-utils';
import { act, screen } from '@testing-library/react';
import nock from 'nock';
import * as backgroundConnection from '../../../../ui/store/background-connection';
import { integrationTestRender } from '../../../lib/render-helpers';
import mockMetaMaskState from '../../data/integration-init-state.json';
import { createMockImplementation, mock4byte } from '../../helpers';
import { getUnapprovedApproveTransaction } from './transactionDataHelpers';
import { TokenStandard } from '../../../../shared/constants/transaction';
import { createTestProviderTools } from '../../../stub/provider';

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

const advancedDetailsMockedRequests = {
  getGasFeeTimeEstimate: {
    lowerTimeBound: new Date().getTime(),
    upperTimeBound: new Date().getTime(),
  },
  getNextNonce: '9',
  decodeTransactionData: {
    data: [
      {
        name: 'approve',
        params: [
          {
            type: 'address',
            value: '0x2e0D7E8c45221FcA00d74a3609A0f7097035d09B',
          },
          {
            type: 'uint256',
            value: 1,
          },
        ],
      },
    ],
    source: 'FourByte',
  },
  getTokenStandardAndDetails: {
    standard: TokenStandard.ERC20,
  },
};

const setupSubmitRequestToBackgroundMocks = (
  mockRequests?: Record<string, unknown>,
) => {
  mockedBackgroundConnection.submitRequestToBackground.mockImplementation(
    createMockImplementation({
      ...advancedDetailsMockedRequests,
      ...(mockRequests ?? {}),
    }),
  );
};

describe('ERC20 Approve Confirmation', () => {
  beforeAll(() => {
    const { provider } = createTestProviderTools({
      networkId: 'sepolia',
      chainId: '0xaa36a7',
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    global.ethereumProvider = provider as any;
  });

  beforeEach(() => {
    jest.resetAllMocks();
    setupSubmitRequestToBackgroundMocks();
    const APPROVE_ERC20_HEX_SIG = '0x095ea7b3';
    const APPROVE_ERC20_TEXT_SIG = 'approve(address,uint256)';
    mock4byte(APPROVE_ERC20_HEX_SIG, APPROVE_ERC20_TEXT_SIG);
  });

  afterEach(() => {
    nock.cleanAll();
  });

  afterAll(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (global as any).ethereumProvider;
  });

  it('displays approve details with correct data', async () => {
    mockedBackgroundConnection.callBackgroundMethod.mockImplementation(
      createMockImplementation({ addKnownMethodData: {} }),
    );

    const account =
      mockMetaMaskState.internalAccounts.accounts[
        mockMetaMaskState.internalAccounts
          .selectedAccount as keyof typeof mockMetaMaskState.internalAccounts.accounts
      ];

    const mockedMetaMaskState =
      getMetaMaskStateWithUnapprovedApproveTransaction(account.address);

    let testContainer;
    await act(async () => {
      const { container } = await integrationTestRender({
        preloadedState: mockedMetaMaskState,
        backgroundConnection: backgroundConnectionMocked,
      });

      testContainer = container;
    });

    expect(await screen.findByText('Spending cap request')).toBeInTheDocument();
    expect(await screen.findByText('Request from')).toBeInTheDocument();

    expect(nock.isDone()).toBe(true);
  });
});
