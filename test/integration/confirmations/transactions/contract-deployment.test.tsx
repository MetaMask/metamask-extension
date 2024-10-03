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
import * as backgroundConnection from '../../../../ui/store/background-connection';
import { tEn } from '../../../lib/i18n-helpers';
import { integrationTestRender } from '../../../lib/render-helpers';
import mockMetaMaskState from '../../data/integration-init-state.json';
import { createMockImplementation, mock4byte } from '../../helpers';
import { getUnapprovedContractDeploymentTransaction } from './transactionDataHelpers';

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

const getMetaMaskStateWithUnapprovedContractDeployment = ({
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
      '0xd0e30db0': {
        name: 'Deposit',
        params: [
          {
            type: 'uint256',
          },
        ],
      },
    },
    transactions: [
      getUnapprovedContractDeploymentTransaction(
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
        name: 'Deposit',
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

describe('Contract Deployment Confirmation', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    setupSubmitRequestToBackgroundMocks();
    const DEPOSIT_HEX_SIG = '0xd0e30db0';
    mock4byte(DEPOSIT_HEX_SIG);
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
      getMetaMaskStateWithUnapprovedContractDeployment({
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
            transaction_type: TransactionType.deployContract,
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
      getMetaMaskStateWithUnapprovedContractDeployment({
        accountAddress: account.address,
      });

    await act(async () => {
      await integrationTestRender({
        preloadedState: mockedMetaMaskState,
        backgroundConnection: backgroundConnectionMocked,
      });
    });

    expect(
      screen.getByText(tEn('confirmTitleDeployContract') as string),
    ).toBeInTheDocument();

    const simulationSection = screen.getByTestId('simulation-details-layout');
    expect(simulationSection).toBeInTheDocument();
    expect(simulationSection).toHaveTextContent(
      tEn('simulationDetailsTitle') as string,
    );
    const simulationDetailsRow = await screen.findByTestId(
      'simulation-rows-incoming',
    );
    expect(simulationSection).toContainElement(simulationDetailsRow);
    expect(simulationDetailsRow).toHaveTextContent(
      tEn('simulationDetailsIncomingHeading') as string,
    );
    expect(simulationDetailsRow).toContainElement(
      screen.getByTestId('simulation-details-amount-pill'),
    );

    const transactionDetailsSection = screen.getByTestId(
      'transaction-details-section',
    );
    expect(transactionDetailsSection).toBeInTheDocument();
    expect(transactionDetailsSection).toHaveTextContent(
      tEn('requestFrom') as string,
    );
    expect(transactionDetailsSection).toHaveTextContent(
      tEn('interactingWith') as string,
    );

    const gasFeesSection = screen.getByTestId('gas-fee-section');
    expect(gasFeesSection).toBeInTheDocument();

    const editGasFeesRow =
      within(gasFeesSection).getByTestId('edit-gas-fees-row');
    expect(editGasFeesRow).toHaveTextContent(tEn('networkFee') as string);

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
    expect(gasFeeSpeed).toHaveTextContent(tEn('speed') as string);

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
      getMetaMaskStateWithUnapprovedContractDeployment({
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
      getMetaMaskStateWithUnapprovedContractDeployment({
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

    const gasFeesSection = screen.getByTestId('gas-fee-section');
    const maxFee = screen.getByTestId('gas-fee-details-max-fee');
    expect(gasFeesSection).toContainElement(maxFee);
    expect(maxFee).toHaveTextContent(tEn('maxFee') as string);
    expect(maxFee).toHaveTextContent('0.0023 ETH');
    expect(maxFee).toHaveTextContent('$7.72');

    const nonceSection = screen.getByTestId('advanced-details-nonce-section');
    expect(nonceSection).toBeInTheDocument();
    expect(nonceSection).toHaveTextContent(
      tEn('advancedDetailsNonceDesc') as string,
    );
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
    expect(dataSectionFunction).toHaveTextContent(
      tEn('transactionDataFunction') as string,
    );
    expect(dataSectionFunction).toHaveTextContent('Deposit');

    const transactionDataParams = screen.getByTestId(
      'advanced-details-data-param-0',
    );
    expect(dataSection).toContainElement(transactionDataParams);
    expect(transactionDataParams).toHaveTextContent('Number Of Tokens');
    expect(transactionDataParams).toHaveTextContent('1');
  });
});
