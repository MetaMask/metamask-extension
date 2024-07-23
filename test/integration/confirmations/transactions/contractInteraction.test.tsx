import { fireEvent, waitFor } from '@testing-library/react';
import { ApprovalType } from '@metamask/controller-utils';
import nock from 'nock';
import { TransactionType } from '@metamask/transaction-controller';
import mockMetaMaskState from '../../data/integration-init-state.json';
import { integrationTestRender } from '../../../lib/render-helpers';
import * as backgroundConnection from '../../../../ui/store/background-connection';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsEventLocation,
} from '../../../../shared/constants/metametrics';
import { createMockImplementation, mock4byte } from '../../helpers';
import { getUnapprovedTransaction } from './transactionDataHelpers';

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

const getMetaMaskStateWithUnapprovedContractInteraction = (
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
      getUnapprovedTransaction(
        accountAddress,
        pendingTransactionId,
        pendingTransactionTime,
      ),
    ],
  };
};

describe('Contract Interaction Confirmation', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mock4byte();
    mockedBackgroundConnection.submitRequestToBackground.mockImplementation(
      createMockImplementation('getGasFeeTimeEstimate', {
        lowerTimeBound: new Date().getTime(),
        upperTimeBound: new Date().getTime(),
      }),
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
      getMetaMaskStateWithUnapprovedContractInteraction(account.address);

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

  it('displays the transaction details section', async () => {
    const account =
      mockMetaMaskState.internalAccounts.accounts[
      mockMetaMaskState.internalAccounts
        .selectedAccount as keyof typeof mockMetaMaskState.internalAccounts.accounts
      ];

    const mockedMetaMaskState =
      getMetaMaskStateWithUnapprovedContractInteraction(account.address);

    const { getByTestId, getByText } = await integrationTestRender({
      preloadedState: mockedMetaMaskState,
      backgroundConnection: backgroundConnectionMocked,
    });

    expect(getByText('Transaction request')).toBeInTheDocument();
    expect(
      getByText('Only confirm this transaction if you fully understand the content and trust the requesting site.'),
    ).toBeInTheDocument();

    const simulationSection = getByTestId('simulation-details-layout');
    expect(simulationSection).toBeInTheDocument();
    expect(simulationSection).toHaveTextContent('Estimated changes');
    // expect(simulationSection).toContainElement(getByTestId('simulation-rows-incoming'));
    // expect(simulationSection).toContainElement(getByTestId('simulation-details-asset-pill'));

    const transactionDetailsSection = getByTestId('transaction-details-section');
    expect(transactionDetailsSection).toBeInTheDocument();
    expect(transactionDetailsSection).toHaveTextContent('Request from');
    expect(transactionDetailsSection).toHaveTextContent('Interacting with');
    expect(transactionDetailsSection).toHaveTextContent('Method');
    expect(transactionDetailsSection).toHaveTextContent('Mint NFTs');

    const gasFeesSection = getByTestId('gas-fee-section');
    expect(gasFeesSection).toBeInTheDocument();
    expect(gasFeesSection).toHaveTextContent('Estimated fee');
    expect(gasFeesSection).toContainElement(getByTestId('first-gas-field'));
    expect(getByTestId('first-gas-field')).toHaveTextContent('0.0084 ETH');
    expect(gasFeesSection).toContainElement(getByTestId('native-currency'));
    expect(getByTestId('native-currency')).toHaveTextContent('$4.66');
    expect(gasFeesSection).toContainElement(getByTestId('edit-gas-fee-icon'));
  });

  it.only('displays the advanced transaction details section', async () => {
    mockedBackgroundConnection.callBackgroundMethod.mockImplementation(createMockImplementation('setPreference', {showConfirmationAdvancedDetails: true}));
    mockedBackgroundConnection.submitRequestToBackground.mockImplementation(createMockImplementation('getNextNonce', '8'));
    const account =
      mockMetaMaskState.internalAccounts.accounts[
      mockMetaMaskState.internalAccounts
        .selectedAccount as keyof typeof mockMetaMaskState.internalAccounts.accounts
      ];

    const mockedMetaMaskState =
      getMetaMaskStateWithUnapprovedContractInteraction(account.address);

    const { getByTestId, getByText, container } = await integrationTestRender({
      preloadedState: mockedMetaMaskState,
      backgroundConnection: backgroundConnectionMocked,
    });

    fireEvent.click(
      getByTestId('header-advanced-details-button'),
    );

    const nonceSection = getByTestId('advanced-details-nonce-section');
    expect(nonceSection).toBeInTheDocument();

    const dataSection = getByTestId('advanced-details-data-section');
    expect(dataSection).toBeInTheDocument();
  });
});
