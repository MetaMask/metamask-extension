import { ApprovalType } from '@metamask/controller-utils';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import nock from 'nock';
import { TokenStandard } from '../../../../shared/constants/transaction';
import * as backgroundConnection from '../../../../ui/store/background-connection';
import { tEn } from '../../../lib/i18n-helpers';
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

const mockedBackgroundConnection = jest.mocked(backgroundConnection);

const backgroundConnectionMocked = {
  onNotification: jest.fn(),
};
export const pendingTransactionId = '48a75190-45ca-11ef-9001-f3886ec2397c';
export const pendingTransactionTime = new Date().getTime();

const getMetaMaskStateWithUnapprovedApproveTransaction = (opts?: {
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
      redesignedConfirmationsEnabled: true,
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
      '0x095ea7b3': {
        name: 'Approve',
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
      getUnapprovedApproveTransaction(
        account.address,
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
        name: 'Approve',
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
    createMockImplementation({ addKnownMethodData: {} }),
  );
};

describe('ERC721 Approve Confirmation', () => {
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
    setupSubmitRequestToBackgroundMocks({
      getTokenStandardAndDetails: {
        standard: TokenStandard.ERC721,
      },
    });
    const APPROVE_NFT_HEX_SIG = '0x095ea7b3';
    const APPROVE_NFT_TEXT_SIG = 'approve(address,uint256)';
    mock4byte(APPROVE_NFT_HEX_SIG, APPROVE_NFT_TEXT_SIG);
  });

  afterEach(() => {
    nock.cleanAll();
  });

  afterAll(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (global as any).ethereumProvider;
  });

  it('displays spending cap request title', async () => {
    const mockedMetaMaskState =
      getMetaMaskStateWithUnapprovedApproveTransaction();

    await act(async () => {
      await integrationTestRender({
        preloadedState: mockedMetaMaskState,
        backgroundConnection: backgroundConnectionMocked,
      });
    });

    expect(
      screen.getByText(tEn('confirmTitleApproveTransaction') as string),
    ).toBeInTheDocument();
    expect(
      screen.getByText(tEn('confirmTitleDescApproveTransaction') as string),
    ).toBeInTheDocument();
  });

  it('displays approve simulation section', async () => {
    const mockedMetaMaskState =
      getMetaMaskStateWithUnapprovedApproveTransaction();

    await act(async () => {
      await integrationTestRender({
        preloadedState: mockedMetaMaskState,
        backgroundConnection: backgroundConnectionMocked,
      });
    });

    const simulationSection = screen.getByTestId(
      'confirmation__simulation_section',
    );
    expect(simulationSection).toBeInTheDocument();

    expect(simulationSection).toHaveTextContent(
      tEn('simulationDetailsApproveDesc') as string,
    );
    expect(simulationSection).toHaveTextContent(
      tEn('simulationApproveHeading') as string,
    );
    const spendingCapValue = screen.getByTestId('simulation-token-value');
    expect(simulationSection).toContainElement(spendingCapValue);
    expect(spendingCapValue).toHaveTextContent('1');
    expect(simulationSection).toHaveTextContent('0x07614...3ad68');
  });

  it('displays approve details with correct data', async () => {
    const testUser = userEvent.setup();

    const mockedMetaMaskState =
      getMetaMaskStateWithUnapprovedApproveTransaction();

    await act(async () => {
      await integrationTestRender({
        preloadedState: mockedMetaMaskState,
        backgroundConnection: backgroundConnectionMocked,
      });
    });

    const approveDetails = screen.getByTestId('confirmation__approve-details');
    expect(approveDetails).toBeInTheDocument();
    const approveDetailsSpender = screen.getByTestId(
      'confirmation__approve-spender',
    );

    expect(approveDetails).toContainElement(approveDetailsSpender);
    expect(approveDetailsSpender).toHaveTextContent(tEn('spender') as string);
    expect(approveDetailsSpender).toHaveTextContent('0x2e0D7...5d09B');
    const spenderTooltip = screen.getByTestId(
      'confirmation__approve-spender-tooltip',
    );
    expect(approveDetailsSpender).toContainElement(spenderTooltip);
    await testUser.hover(spenderTooltip);
    const spenderTooltipContent = await screen.findByText(
      tEn('spenderTooltipDesc') as string,
    );
    expect(spenderTooltipContent).toBeInTheDocument();

    const approveDetailsRequestFrom = screen.getByTestId(
      'transaction-details-origin-row',
    );
    expect(approveDetails).toContainElement(approveDetailsRequestFrom);
    expect(approveDetailsRequestFrom).toHaveTextContent(
      tEn('requestFrom') as string,
    );
    expect(approveDetailsRequestFrom).toHaveTextContent(
      'http://localhost:8086/',
    );

    const approveDetailsRequestFromTooltip = screen.getByTestId(
      'transaction-details-origin-row-tooltip',
    );
    expect(approveDetailsRequestFrom).toContainElement(
      approveDetailsRequestFromTooltip,
    );
    await testUser.hover(approveDetailsRequestFromTooltip);
    const requestFromTooltipContent = await screen.findByText(
      tEn('requestFromTransactionDescription') as string,
    );
    expect(requestFromTooltipContent).toBeInTheDocument();
  });

  it('displays the advanced transaction details section', async () => {
    const testUser = userEvent.setup();

    const mockedMetaMaskState =
      getMetaMaskStateWithUnapprovedApproveTransaction({
        showAdvanceDetails: true,
      });

    await act(async () => {
      await integrationTestRender({
        preloadedState: mockedMetaMaskState,
        backgroundConnection: backgroundConnectionMocked,
      });
    });

    const approveDetails = screen.getByTestId('confirmation__approve-details');
    expect(approveDetails).toBeInTheDocument();

    const approveDetailsRecipient = screen.getByTestId(
      'transaction-details-recipient-row',
    );
    expect(approveDetails).toContainElement(approveDetailsRecipient);
    expect(approveDetailsRecipient).toHaveTextContent(
      tEn('interactingWith') as string,
    );
    expect(approveDetailsRecipient).toHaveTextContent('0x07614...3ad68');

    const approveDetailsRecipientTooltip = screen.getByTestId(
      'transaction-details-recipient-row-tooltip',
    );
    expect(approveDetailsRecipient).toContainElement(
      approveDetailsRecipientTooltip,
    );
    await testUser.hover(approveDetailsRecipientTooltip);
    const recipientTooltipContent = await screen.findByText(
      tEn('interactingWithTransactionDescription') as string,
    );
    expect(recipientTooltipContent).toBeInTheDocument();

    const approveMethodData = await screen.findByTestId(
      'transaction-details-method-data-row',
    );
    expect(approveDetails).toContainElement(approveMethodData);
    expect(approveMethodData).toHaveTextContent(tEn('methodData') as string);
    expect(approveMethodData).toHaveTextContent('Approve');
    const approveMethodDataTooltip = screen.getByTestId(
      'transaction-details-method-data-row-tooltip',
    );
    expect(approveMethodData).toContainElement(approveMethodDataTooltip);
    await testUser.hover(approveMethodDataTooltip);
    const approveMethodDataTooltipContent = await screen.findByText(
      tEn('methodDataTransactionDesc') as string,
    );
    expect(approveMethodDataTooltipContent).toBeInTheDocument();

    const approveDetailsNonce = screen.getByTestId(
      'advanced-details-nonce-section',
    );
    expect(approveDetailsNonce).toBeInTheDocument();

    const dataSection = screen.getByTestId('advanced-details-data-section');
    expect(dataSection).toBeInTheDocument();

    const dataSectionFunction = screen.getByTestId(
      'advanced-details-data-function',
    );
    expect(dataSection).toContainElement(dataSectionFunction);
    expect(dataSectionFunction).toHaveTextContent(
      tEn('transactionDataFunction') as string,
    );
    expect(dataSectionFunction).toHaveTextContent('Approve');

    const approveDataParams1 = screen.getByTestId(
      'advanced-details-data-param-0',
    );
    expect(dataSection).toContainElement(approveDataParams1);
    expect(approveDataParams1).toHaveTextContent('Param #1');
    expect(approveDataParams1).toHaveTextContent('0x2e0D7...5d09B');

    const approveDataParams2 = screen.getByTestId(
      'advanced-details-data-param-1',
    );
    expect(dataSection).toContainElement(approveDataParams2);
    expect(approveDataParams2).toHaveTextContent('Param #2');
    expect(approveDataParams2).toHaveTextContent('1');
  });
});
