import React from 'react';
import { act, fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/jest';
import { GasFeeContextProvider } from '../../../../contexts/gasFee';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import EditGasFeeIcon from './edit-gas-fee-icon';

jest.mock('../../../../store/actions', () => ({
  gasFeeStartPollingByNetworkClientId: jest
    .fn()
    .mockResolvedValue('pollingToken'),
  gasFeeStopPollingByPollingToken: jest.fn(),
  getNetworkConfigurationByNetworkClientId: jest
    .fn()
    .mockResolvedValue({ chainId: '0x5' }),
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

const render = async () => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
    },
  });

  let result;

  await act(
    async () =>
      (result = renderWithProvider(
        <GasFeeContextProvider>
          <EditGasFeeIcon />
        </GasFeeContextProvider>,
        store,
      )),
  );

  return result;
};

describe('EditGasFeeIcon', () => {
  it('should render edit icon', async () => {
    await render();
    const iconButton = screen.getByTestId('edit-gas-fee-icon');
    expect(iconButton).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(iconButton);
    });
    expect(mockOpenModalFn).toHaveBeenCalledTimes(1);
  });
});
