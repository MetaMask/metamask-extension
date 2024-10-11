import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { SimulationErrorCode } from '@metamask/transaction-controller';
import {
  getMockConfirmState,
  getMockConfirmStateForTransaction,
  getMockContractInteractionConfirmState,
} from '../../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import { CHAIN_IDS } from '../../../../../../../../shared/constants/network';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../../test/data/confirmations/contract-interaction';
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

  it('renders component for transaction details with amount', () => {
    const simulationDataMock = {
      error: { code: SimulationErrorCode.Disabled },
      tokenBalanceChanges: [],
    };
    const contractInteraction = genUnapprovedContractInteractionConfirmation({
      simulationData: simulationDataMock,
      chainId: CHAIN_IDS.GOERLI,
    });
    const state = getMockConfirmStateForTransaction(contractInteraction);
    const mockStore = configureMockStore(middleware)(state);
    const { getByTestId } = renderWithConfirmContextProvider(
      <TransactionDetails />,
      mockStore,
    );
    expect(getByTestId('transaction-details-amount-row')).toBeInTheDocument();
  });
});
