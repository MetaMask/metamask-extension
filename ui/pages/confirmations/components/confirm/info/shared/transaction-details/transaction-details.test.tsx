import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {
  getMockConfirmState,
  getMockContractInteractionConfirmState,
} from '../../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import { TransactionDetails } from './transaction-details';

jest.mock(
  '../../../../../../../components/app/alert-system/contexts/alertMetricsContext',
  () => ({
    useAlertMetrics: jest.fn(() => ({
      trackAlertMetrics: jest.fn(),
    })),
  }),
);

describe('<TransactionDetails />', () => {
  const middleware = [thunk];

  it('does not render component for transaction details', () => {
    const state = getMockConfirmState();
    const mockStore = configureMockStore(middleware)(state);
    const { container } = renderWithConfirmContextProvider(
      <TransactionDetails />,
      mockStore,
    );
    expect(container).toMatchSnapshot();
  });

  it('renders component for transaction details', () => {
    const state = getMockContractInteractionConfirmState();
    const mockStore = configureMockStore(middleware)(state);
    const { container } = renderWithConfirmContextProvider(
      <TransactionDetails />,
      mockStore,
    );
    expect(container).toMatchSnapshot();
  });
});
