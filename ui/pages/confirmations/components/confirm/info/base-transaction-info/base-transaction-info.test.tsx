import { waitFor } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';

import {
  getMockConfirmStateForTransaction,
  getMockContractInteractionConfirmState,
} from '../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../test/lib/confirmations/render-helpers';
import BaseTransactionInfo from './base-transaction-info';

jest.mock('../../../../../../store/actions', () => ({
  ...jest.requireActual('../../../../../../store/actions'),
  getGasFeeTimeEstimate: jest.fn().mockResolvedValue({
    lowerTimeBound: 0,
    upperTimeBound: 60000,
  }),
}));

jest.mock(
  '../../../../../../components/app/alert-system/contexts/alertMetricsContext',
  () => ({
    useAlertMetrics: jest.fn(() => ({
      trackAlertMetrics: jest.fn(),
    })),
  }),
);

describe('<BaseTransactionInfo />', () => {
  const middleware = [thunk];

  it('renders component for contract interaction request', async () => {
    const state = getMockContractInteractionConfirmState();
    const mockStore = configureMockStore(middleware)(state);

    const { container } = renderWithConfirmContextProvider(
      <BaseTransactionInfo />,
      mockStore,
    );

    await waitFor(() => {
      expect(container).toMatchSnapshot();
    });
  });

  it('does not render if required data is not present in the transaction', () => {
    const state = getMockConfirmStateForTransaction({
      id: '0050d5b0-c023-11ee-a0cb-3390a510a0ab',
      status: TransactionStatus.unapproved,
      time: new Date().getTime(),
      type: TransactionType.contractInteraction,
    });
    const mockStore = configureMockStore(middleware)(state);
    const { container } = renderWithConfirmContextProvider(
      <BaseTransactionInfo />,
      mockStore,
    );
    expect(container).toMatchSnapshot();
  });
});
