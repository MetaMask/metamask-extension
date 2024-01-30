import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/jest';
import { GasFeeContextProvider } from '../../../../contexts/gasFee';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import EditGasFeeIcon from './edit-gas-fee-icon';

jest.mock('../../../../store/actions', () => ({
  disconnectGasFeeEstimatePoller: jest.fn(),
  getGasFeeEstimatesAndStartPolling: jest
    .fn()
    .mockImplementation(() => Promise.resolve()),
  addPollingTokenToAppState: jest.fn(),
  createTransactionEventFragment: jest.fn(),
}));

const mockOpenModalFn = jest.fn();
jest.mock('../../../../contexts/transaction-modal', () => ({
  useTransactionModalContext: () => ({
    closeModal: () => undefined,
    openModal: mockOpenModalFn,
    currentModal: 'editGasFee',
  }),
}));

const render = () => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
    },
  });

  return renderWithProvider(
    <GasFeeContextProvider>
      <EditGasFeeIcon />
    </GasFeeContextProvider>,
    store,
  );
};

describe('EditGasFeeIcon', () => {
  it('should render edit icon', () => {
    render();
    const iconButton = screen.getByTestId('edit-gas-fee-icon');
    expect(iconButton).toBeInTheDocument();
    fireEvent.click(iconButton);
    expect(mockOpenModalFn).toHaveBeenCalledTimes(1);
  });
});
