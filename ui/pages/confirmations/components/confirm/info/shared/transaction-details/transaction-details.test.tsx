import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { SimulationErrorCode } from '@metamask/transaction-controller';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../../test/data/confirmations/contract-interaction';
import mockState from '../../../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../../../test/lib/render-helpers';
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
    const state = { ...mockState, confirm: { currentConfirmation: null } };
    const mockStore = configureMockStore(middleware)(state);
    const { container } = renderWithProvider(<TransactionDetails />, mockStore);
    expect(container).toMatchSnapshot();
  });

  it('renders component for transaction details', () => {
    const state = {
      ...mockState,
      confirm: {
        currentConfirmation: genUnapprovedContractInteractionConfirmation(),
      },
    };
    const mockStore = configureMockStore(middleware)(state);
    const { container } = renderWithProvider(<TransactionDetails />, mockStore);
    expect(container).toMatchSnapshot();
  });

  it('renders component for transaction details with amount', () => {
    const simulationDataMock = {
      error: { code: SimulationErrorCode.Disabled },
      tokenBalanceChanges: [],
    };
    const contractInteraction = genUnapprovedContractInteractionConfirmation({
      simulationData: simulationDataMock,
    });
    const state = {
      ...mockState,
      confirm: {
        currentConfirmation: contractInteraction,
      },
    };
    const mockStore = configureMockStore(middleware)(state);
    const { getByTestId } = renderWithConfirmContextProvider(
      <TransactionDetails />,
      mockStore,
    );
    expect(getByTestId('transaction-details-amount-row')).toBeInTheDocument();
  });
});