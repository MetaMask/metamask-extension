import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {
  SmartTransaction,
  SmartTransactionStatuses,
} from '@metamask/smart-transactions-controller';

import { fireEvent } from '@testing-library/react';
import {
  renderWithProvider,
  createSwapsMockStore,
} from '../../../../test/jest';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import {
  SmartTransactionStatusPage,
  RequestState,
} from './smart-transaction-status-page';

// Mock the SmartTransactionStatusAnimation component and capture props
jest.mock('./smart-transaction-status-animation', () => ({
  SmartTransactionStatusAnimation: ({
    status,
  }: {
    status: SmartTransactionStatuses;
  }) => <div data-testid="mock-animation" data-status={status} />,
}));

const middleware = [thunk];
const mockStore = configureMockStore(middleware);

const defaultRequestState: RequestState = {
  smartTransaction: {
    status: SmartTransactionStatuses.PENDING,
    creationTime: Date.now(),
    uuid: 'uuid',
    chainId: CHAIN_IDS.MAINNET,
  },
  isDapp: false,
  txId: 'txId',
};

describe('SmartTransactionStatusPage', () => {
  const statusTestCases = [
    {
      status: SmartTransactionStatuses.PENDING,
      isDapp: false,
      expectedTexts: ['Your transaction was submitted', 'View activity'],
      snapshotName: 'pending',
    },
    {
      status: SmartTransactionStatuses.SUCCESS,
      isDapp: false,
      expectedTexts: [
        'Your transaction is complete',
        'View transaction',
        'View activity',
      ],
      snapshotName: 'success',
    },
    {
      status: SmartTransactionStatuses.REVERTED,
      isDapp: false,
      expectedTexts: [
        'Your transaction failed',
        'View transaction',
        'View activity',
        'Sudden market changes can cause failures. If the problem continues, reach out to MetaMask customer support.',
      ],
      snapshotName: 'failed',
    },
  ];

  statusTestCases.forEach(({ status, isDapp, expectedTexts, snapshotName }) => {
    it(`renders the "${snapshotName}" STX status${
      isDapp ? ' for a dapp transaction' : ''
    }`, () => {
      const state = createSwapsMockStore();
      const latestSmartTransaction =
        state.metamask.smartTransactionsState.smartTransactions[
          CHAIN_IDS.MAINNET
        ][1];
      latestSmartTransaction.status = status;
      const requestState: RequestState = {
        smartTransaction: latestSmartTransaction as SmartTransaction,
        isDapp,
        txId: 'txId',
      };

      const { getByText, getByTestId, container } = renderWithProvider(
        <SmartTransactionStatusPage requestState={requestState} />,
        mockStore(state),
      );

      expectedTexts.forEach((text) => {
        expect(getByText(text)).toBeInTheDocument();
      });

      expect(getByTestId('mock-animation')).toBeInTheDocument();
      expect(getByTestId('mock-animation')).toHaveAttribute(
        'data-status',
        status,
      );
      expect(container).toMatchSnapshot(
        `smart-transaction-status-${snapshotName}`,
      );
    });
  });

  describe('Action Buttons', () => {
    it('calls onCloseExtension when Close extension button is clicked', () => {
      const onCloseExtension = jest.fn();
      const store = mockStore(createSwapsMockStore());

      const { getByText } = renderWithProvider(
        <SmartTransactionStatusPage
          requestState={{ ...defaultRequestState, isDapp: true }}
          onCloseExtension={onCloseExtension}
        />,
        store,
      );

      const closeButton = getByText('Close extension');
      fireEvent.click(closeButton);
      expect(onCloseExtension).toHaveBeenCalled();
    });

    it('calls onViewActivity when View activity button is clicked', () => {
      const onViewActivity = jest.fn();
      const store = mockStore(createSwapsMockStore());

      const { getByText } = renderWithProvider(
        <SmartTransactionStatusPage
          requestState={{ ...defaultRequestState, isDapp: false }}
          onViewActivity={onViewActivity}
        />,
        store,
      );

      const viewActivityButton = getByText('View activity');
      fireEvent.click(viewActivityButton);
      expect(onViewActivity).toHaveBeenCalled();
    });
  });
});
