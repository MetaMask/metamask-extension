import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../../../test/lib/render-helpers-navigate';
import { useGasFeeModalContext } from '../../../../../context/gas-fee-modal';
import { useConfirmContext } from '../../../../../context/confirm';
import { GasModalType } from '../../../../../constants/gas';
import { EditGasIconButton } from './edit-gas-icon-button';

jest.mock('../../../../../context/gas-fee-modal', () => ({
  useGasFeeModalContext: jest.fn(),
}));

jest.mock('../../../../../context/confirm', () => ({
  useConfirmContext: jest.fn(),
}));

describe('<EditGasIconButton />', () => {
  const middleware = [thunk];
  const openGasFeeModalMock = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();

    (useGasFeeModalContext as jest.Mock).mockReturnValue({
      openGasFeeModal: openGasFeeModalMock,
      closeGasFeeModal: jest.fn(),
      isGasFeeModalVisible: false,
      initialModalType: GasModalType.EstimatesModal,
    });

    (useConfirmContext as jest.Mock).mockReturnValue({
      currentConfirmation: {
        id: 'test-tx-id',
        txParams: {},
      },
    });
  });

  it('renders component', () => {
    const state = mockState;
    const mockStore = configureMockStore(middleware)(state);
    const { container } = renderWithProvider(<EditGasIconButton />, mockStore);

    expect(container).toMatchSnapshot();
  });
});
