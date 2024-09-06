import { ApprovalType } from '@metamask/controller-utils';
import { TransactionType } from '@metamask/transaction-controller';
import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import nock from 'nock';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventLocation,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { useApproveTokenSimulation } from '../../../../ui/pages/confirmations/components/confirm/info/approve/hooks/use-approve-token-simulation';
import { useAssetDetails } from '../../../../ui/pages/confirmations/hooks/useAssetDetails';
import * as backgroundConnection from '../../../../ui/store/background-connection';
import { integrationTestRender } from '../../../lib/render-helpers';
import mockMetaMaskState from '../../data/integration-init-state.json';
import { createMockImplementation, mock4byte } from '../../helpers';
import {
  getMaliciousUnapprovedTransaction,
  getUnapprovedTransaction,
} from './transactionDataHelpers';

jest.mock('../../../../ui/store/background-connection', () => ({
  ...jest.requireActual('../../../../ui/store/background-connection'),
  submitRequestToBackground: jest.fn(),
  callBackgroundMethod: jest.fn(),
}));

jest.mock('../../../../ui/pages/confirmations/hooks/useAssetDetails', () => ({
  ...jest.requireActual(
    '../../../../ui/pages/confirmations/hooks/useAssetDetails',
  ),
  useAssetDetails: jest.fn(),
}));

jest.mock(
  '../../../../ui/pages/confirmations/components/confirm/info/approve/hooks/use-approve-token-simulation',
  () => ({
    ...jest.requireActual(
      '../../../../ui/pages/confirmations/components/confirm/info/approve/hooks/use-approve-token-simulation',
    ),
    useApproveTokenSimulation: jest.fn(),
  }),
);

const mockedBackgroundConnection = jest.mocked(backgroundConnection);

const backgroundConnectionMocked = {
  onNotification: jest.fn(),
};
export const pendingTransactionId = '48a75190-45ca-11ef-9001-f3886ec2397c';
export const pendingTransactionTime = new Date().getTime();

const getMetaMaskStateWithUnapprovedContractInteraction = ({
  accountAddress,
  showConfirmationAdvancedDetails = false,
}: {
  accountAddress: string;
  showConfirmationAdvancedDetails?: boolean;
}) => {
  return {
    ...mockMetaMaskState,
    preferences: {
      ...mockMetaMaskState.preferences,
      redesignedConfirmationsEnabled: true,
      showConfirmationAdvancedDetails,
    },
    nextNonce: '8',
    currencyRates: {
      SepoliaETH: {
        conversionDate: 1721392020.645,
        conversionRate: 3404.13,
        usdConversionRate: 3404.13,
      },
      ETH: {
        conversionDate: 1721393858.083,
        conversionRate: 3414.67,
        usdConversionRate: 3414.67,
      },
    },
    currentCurrency: 'usd',
    pendingApprovals: {
      [pendingTransactionId]: {
        id: pendingTransactionId,
        origin: 'local:http://localhost:8086/',
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
      getUnapprovedTransaction(
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
        name: 'mintNFTs',
        params: [
          {
            name: 'numberOfTokens',
            type: 'uint256',
            value: 1,
          },
        ],
      },
    ],
    source: 'Sourcify',
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

const getMetaMaskStateWithMaliciousUnapprovedContractInteraction = (
  accountAddress: string,
) => {
  return {
    ...getMetaMaskStateWithUnapprovedContractInteraction({ accountAddress }),
    transactions: [
      getMaliciousUnapprovedTransaction(
        accountAddress,
        pendingTransactionId,
        pendingTransactionTime,
      ),
    ],
  };
};

describe('Contract Interaction Confirmation', () => {
  let useAssetDetailsMock, useApproveTokenSimulationMock;
  beforeEach(() => {
    jest.resetAllMocks();
    setupSubmitRequestToBackgroundMocks();
    const MINT_NFT_HEX_SIG = '0x3b4b1381';
    mock4byte(MINT_NFT_HEX_SIG);
    useAssetDetailsMock = jest.fn().mockImplementation(() => ({
      decimals: 18,
      userBalance: '1000000',
      tokenSymbol: 'TST',
    }));
    (useAssetDetails as jest.Mock).mockImplementation(useAssetDetailsMock);
    useApproveTokenSimulationMock = jest.fn().mockImplementation(() => ({
      spendingCap: '1000',
      formattedSpendingCap: '1000',
      value: '1000',
    }));
    (useApproveTokenSimulation as jest.Mock).mockImplementation(
      useApproveTokenSimulationMock,
    );
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('displays the header account modal with correct data', async () => {
    const account =
      mockMetaMaskState.internalAccounts.accounts[
        mockMetaMaskState.internalAccounts
          .selectedAccount as keyof typeof mockMetaMaskState.internalAccounts.accounts
      ];

    const accountName = account.metadata.name;
    const mockedMetaMaskState =
      getMetaMaskStateWithUnapprovedContractInteraction({
        accountAddress: account.address,
      });

    await act(async () => {
      await integrationTestRender({
        preloadedState: mockedMetaMaskState,
        backgroundConnection: backgroundConnectionMocked,
      });
    });

    expect(screen.getByTestId('header-account-name')).toHaveTextContent(
      accountName,
    );
    expect(screen.getByTestId('header-network-display-name')).toHaveTextContent(
      'Sepolia',
    );

    fireEvent.click(screen.getByTestId('header-info__account-details-button'));

    expect(
      await screen.findByTestId(
        'confirmation-account-details-modal__account-name',
      ),
    ).toHaveTextContent(accountName);
    expect(screen.getByTestId('address-copy-button-text')).toHaveTextContent(
      '0x0DCD5...3E7bc',
    );
    expect(
      screen.getByTestId('confirmation-account-details-modal__account-balance'),
    ).toHaveTextContent('1.582717SepoliaETH');

    let confirmAccountDetailsModalMetricsEvent;

    await waitFor(() => {
      confirmAccountDetailsModalMetricsEvent =
        mockedBackgroundConnection.submitRequestToBackground.mock.calls?.find(
          (call) =>
            call[0] === 'trackMetaMetricsEvent' &&
            call[1]?.[0].category === MetaMetricsEventCategory.Confirmations,
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
      screen.getByTestId('confirmation-account-details-modal__close-button'),
    );

    await waitFor(() => {
      expect(
        screen.queryByTestId(
          'confirmation-account-details-modal__account-name',
        ),
      ).not.toBeInTheDocument();
    });
  });

  it('displays the transaction details section', async () => {
    const account =
      mockMetaMaskState.internalAccounts.accounts[
        mockMetaMaskState.internalAccounts
          .selectedAccount as keyof typeof mockMetaMaskState.internalAccounts.accounts
      ];

    const mockedMetaMaskState =
      getMetaMaskStateWithUnapprovedContractInteraction({
        accountAddress: account.address,
      });

    await act(async () => {
      await integrationTestRender({
        preloadedState: mockedMetaMaskState,
        backgroundConnection: backgroundConnectionMocked,
      });
    });

    expect(screen.getByText('Transaction request')).toBeInTheDocument();

    const simulationSection = screen.getByTestId('simulation-details-layout');
    expect(simulationSection).toBeInTheDocument();
    expect(simulationSection).toHaveTextContent('Estimated changes');
    const simulationDetailsRow = await screen.findByTestId(
      'simulation-rows-incoming',
    );
    expect(simulationSection).toContainElement(simulationDetailsRow);
    expect(simulationDetailsRow).toHaveTextContent('You receive');
    expect(simulationDetailsRow).toContainElement(
      screen.getByTestId('simulation-details-asset-pill'),
    );
    expect(simulationDetailsRow).toContainElement(
      screen.getByTestId('simulation-details-amount-pill'),
    );

    const transactionDetailsSection = screen.getByTestId(
      'transaction-details-section',
    );
    expect(transactionDetailsSection).toBeInTheDocument();
    expect(transactionDetailsSection).toHaveTextContent('Request from');
    expect(transactionDetailsSection).toHaveTextContent('Interacting with');

    const gasFeesSection = screen.getByTestId('gas-fee-section');
    expect(gasFeesSection).toBeInTheDocument();

    const editGasFeesRow =
      within(gasFeesSection).getByTestId('edit-gas-fees-row');
    expect(editGasFeesRow).toHaveTextContent('Network fee');

    const firstGasField = within(editGasFeesRow).getByTestId('first-gas-field');
    expect(firstGasField).toHaveTextContent('0.0001 ETH');
    const editGasFeeNativeCurrency =
      within(editGasFeesRow).getByTestId('native-currency');
    expect(editGasFeeNativeCurrency).toHaveTextContent('$0.47');
    expect(editGasFeesRow).toContainElement(
      screen.getByTestId('edit-gas-fee-icon'),
    );

    const gasFeeSpeed = within(gasFeesSection).getByTestId(
      'gas-fee-details-speed',
    );
    expect(gasFeeSpeed).toHaveTextContent('Speed');

    const gasTimingTime = within(gasFeeSpeed).getByTestId('gas-timing-time');
    expect(gasTimingTime).toHaveTextContent('~0 sec');
  });

  it('sets the preference showConfirmationAdvancedDetails to true when advanced details button is clicked', async () => {
    mockedBackgroundConnection.callBackgroundMethod.mockImplementation(
      createMockImplementation({ setPreference: {} }),
    );

    const account =
      mockMetaMaskState.internalAccounts.accounts[
        mockMetaMaskState.internalAccounts
          .selectedAccount as keyof typeof mockMetaMaskState.internalAccounts.accounts
      ];

    const mockedMetaMaskState =
      getMetaMaskStateWithUnapprovedContractInteraction({
        accountAddress: account.address,
        showConfirmationAdvancedDetails: false,
      });

    await act(async () => {
      await integrationTestRender({
        preloadedState: mockedMetaMaskState,
        backgroundConnection: backgroundConnectionMocked,
      });
    });

    fireEvent.click(screen.getByTestId('header-advanced-details-button'));

    await waitFor(() => {
      expect(
        mockedBackgroundConnection.callBackgroundMethod,
      ).toHaveBeenCalledWith(
        'setPreference',
        ['showConfirmationAdvancedDetails', true],
        expect.anything(),
      );
    });
  });

  it('displays the advanced transaction details section', async () => {
    mockedBackgroundConnection.callBackgroundMethod.mockImplementation(
      createMockImplementation({ setPreference: {} }),
    );

    const account =
      mockMetaMaskState.internalAccounts.accounts[
        mockMetaMaskState.internalAccounts
          .selectedAccount as keyof typeof mockMetaMaskState.internalAccounts.accounts
      ];

    const mockedMetaMaskState =
      getMetaMaskStateWithUnapprovedContractInteraction({
        accountAddress: account.address,
        showConfirmationAdvancedDetails: true,
      });

    await act(async () => {
      await integrationTestRender({
        preloadedState: mockedMetaMaskState,
        backgroundConnection: backgroundConnectionMocked,
      });
    });

    await waitFor(() => {
      expect(
        mockedBackgroundConnection.submitRequestToBackground,
      ).toHaveBeenCalledWith('getNextNonce', expect.anything());
    });

    await waitFor(() => {
      expect(
        mockedBackgroundConnection.submitRequestToBackground,
      ).toHaveBeenCalledWith('decodeTransactionData', [
        {
          transactionData:
            '0x3b4b13810000000000000000000000000000000000000000000000000000000000000001',
          contractAddress: '0x076146c765189d51be3160a2140cf80bfc73ad68',
          chainId: '0xaa36a7',
        },
      ]);
    });

    const gasFeesSection = screen.getByTestId('gas-fee-section');
    const maxFee = screen.getByTestId('gas-fee-details-max-fee');
    expect(gasFeesSection).toContainElement(maxFee);
    expect(maxFee).toHaveTextContent('Max fee');
    expect(maxFee).toHaveTextContent('0.0023 ETH');
    expect(maxFee).toHaveTextContent('$7.72');

    const nonceSection = screen.getByTestId('advanced-details-nonce-section');
    expect(nonceSection).toBeInTheDocument();
    expect(nonceSection).toHaveTextContent('Nonce');
    expect(nonceSection).toContainElement(
      screen.getByTestId('advanced-details-displayed-nonce'),
    );
    expect(
      screen.getByTestId('advanced-details-displayed-nonce'),
    ).toHaveTextContent('9');

    const dataSection = screen.getByTestId('advanced-details-data-section');
    expect(dataSection).toBeInTheDocument();

    const dataSectionFunction = screen.getByTestId(
      'advanced-details-data-function',
    );
    expect(dataSection).toContainElement(dataSectionFunction);
    expect(dataSectionFunction).toHaveTextContent('Function');
    expect(dataSectionFunction).toHaveTextContent('mintNFTs');

    const transactionDataParams = screen.getByTestId(
      'advanced-details-data-param-0',
    );
    expect(dataSection).toContainElement(transactionDataParams);
    expect(transactionDataParams).toHaveTextContent('Number Of Tokens');
    expect(transactionDataParams).toHaveTextContent('1');
  });

  it('displays the warning for malicious request', async () => {
    const account =
      mockMetaMaskState.internalAccounts.accounts[
        mockMetaMaskState.internalAccounts
          .selectedAccount as keyof typeof mockMetaMaskState.internalAccounts.accounts
      ];

    const mockedMetaMaskState =
      getMetaMaskStateWithMaliciousUnapprovedContractInteraction(
        account.address,
      );

    await act(async () => {
      await integrationTestRender({
        preloadedState: mockedMetaMaskState,
        backgroundConnection: backgroundConnectionMocked,
      });
    });

    const headingText = 'This is a deceptive request';
    const bodyText =
      'If you approve this request, a third party known for scams will take all your assets.';
    expect(screen.getByText(headingText)).toBeInTheDocument();
    expect(screen.getByText(bodyText)).toBeInTheDocument();
  });
});
