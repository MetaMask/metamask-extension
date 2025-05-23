import { ApprovalType } from '@metamask/controller-utils';
import { act, screen, within } from '@testing-library/react';
import nock from 'nock';
import { TokenStandard } from '../../../../shared/constants/transaction';
import { useAssetDetails } from '../../../../ui/pages/confirmations/hooks/useAssetDetails';
import * as backgroundConnection from '../../../../ui/store/background-connection';
import { tEn } from '../../../lib/i18n-helpers';
import { integrationTestRender } from '../../../lib/render-helpers';
import { createTestProviderTools } from '../../../stub/provider';
import mockMetaMaskState from '../../data/integration-init-state.json';
import { createMockImplementation, mock4byte } from '../../helpers';
import { getUnapprovedSetApprovalForAllTransaction } from './transactionDataHelpers';

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

const getMetaMaskStateWithUnapprovedRevokeTx = (opts?: {
  showAdvanceDetails: boolean;
}) => {
  const account =
    mockMetaMaskState.internalAccounts.accounts[
      mockMetaMaskState.internalAccounts
        .selectedAccount as keyof typeof mockMetaMaskState.internalAccounts.accounts
    ];

  return {
    ...mockMetaMaskState,
    preferences: {
      ...mockMetaMaskState.preferences,
      showConfirmationAdvancedDetails: opts?.showAdvanceDetails ?? false,
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
      '0xa22cb465': {
        name: 'setApprovalForAll',
        params: [
          {
            type: 'address',
          },
          {
            type: 'bool',
          },
        ],
      },
    },
    transactions: [
      getUnapprovedSetApprovalForAllTransaction(
        account.address,
        pendingTransactionId,
        pendingTransactionTime,
        false,
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
        name: 'setApprovalForAll',
        params: [
          {
            type: 'address',
            value: '0x2e0D7E8c45221FcA00d74a3609A0f7097035d09B',
          },
          {
            type: 'bool',
            value: false,
          },
        ],
      },
    ],
    source: 'FourByte',
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

  mockedBackgroundConnection.callBackgroundMethod.mockImplementation(
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    createMockImplementation({ addKnownMethodData: {} }),
  );
};

describe('ERC721 setApprovalForAll - Revoke Confirmation', () => {
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
    setupSubmitRequestToBackgroundMocks({
      getTokenStandardAndDetails: {
        standard: TokenStandard.ERC721,
      },
    });
    const INCREASE_SET_APPROVAL_FOR_ALL_HEX_SIG = '0xa22cb465';
    const INCREASE_SET_APPROVAL_FOR_ALL_TEXT_SIG =
      'setApprovalForAll(address,bool)';
    mock4byte(
      INCREASE_SET_APPROVAL_FOR_ALL_HEX_SIG,
      INCREASE_SET_APPROVAL_FOR_ALL_TEXT_SIG,
    );
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

  it('displays revoke request title', async () => {
    const mockedMetaMaskState = getMetaMaskStateWithUnapprovedRevokeTx();

    await act(async () => {
      await integrationTestRender({
        preloadedState: mockedMetaMaskState,
        backgroundConnection: backgroundConnectionMocked,
      });
    });

    expect(
      await screen.findByText(
        tEn('confirmTitleRevokeApproveTransaction') as string,
      ),
    ).toBeInTheDocument();
  });

  it('displays revoke simulation section', async () => {
    const mockedMetaMaskState = getMetaMaskStateWithUnapprovedRevokeTx();

    await act(async () => {
      await integrationTestRender({
        preloadedState: mockedMetaMaskState,
        backgroundConnection: backgroundConnectionMocked,
      });
    });

    const simulationSection = await screen.findByTestId(
      'confirmation__simulation_section',
    );
    expect(simulationSection).toBeInTheDocument();
    console.log(simulationSection);

    const withinSimulationSection = within(simulationSection);

    expect(
      withinSimulationSection.getByText(
        tEn('simulationDetailsTitle') as string,
      ),
    ).toBeInTheDocument();
    expect(
      withinSimulationSection.getByText(
        tEn('simulationDetailsRevokeSetApprovalForAllDesc') as string,
      ),
    ).toBeInTheDocument();
    expect(
      withinSimulationSection.getByText(tEn('nfts') as string),
    ).toBeInTheDocument();
    expect(
      withinSimulationSection.getByText(tEn('permissionFrom') as string),
    ).toBeInTheDocument();

    expect(
      withinSimulationSection.getByText('0x9bc5b...AfEF4'),
    ).toBeInTheDocument();
    expect(
      withinSimulationSection.getByText('0x07614...3ad68'),
    ).toBeInTheDocument();

    const spendingCapValue = await screen.queryByTestId(
      'simulation-token-value',
    );
    expect(spendingCapValue).toBeNull();
  });
});
