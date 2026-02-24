import React from 'react';
import { DefaultRootState } from 'react-redux';
import { fireEvent } from '@testing-library/react';

import { getMockTokenTransferConfirmState } from '../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import configureStore from '../../../../../store/store';
import * as ConfirmActions from '../../../hooks/useConfirmActions';
import { WalletInitiatedHeader } from './wallet-initiated-header';

const render = (
  state: DefaultRootState = getMockTokenTransferConfirmState({}),
) => {
  const store = configureStore(state);
  return renderWithConfirmContextProvider(<WalletInitiatedHeader />, store);
};

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

describe('<WalletInitiatedHeader />', () => {
  it('should match snapshot', () => {
    const { container } = render();

    expect(container).toMatchSnapshot();
  });

  it('call onCancel from useConfirmActions when back button is pressed', () => {
    const mockOnCancel = jest.fn();
    jest.spyOn(ConfirmActions, 'useConfirmActions').mockImplementation(() => ({
      onCancel: mockOnCancel,
      resetTransactionState: jest.fn(),
    }));
    const { getByTestId } = render(
      getMockTokenTransferConfirmState({ isWalletInitiatedConfirmation: true }),
    );
    fireEvent.click(getByTestId('wallet-initiated-header-back-button'));
    expect(mockOnCancel).toHaveBeenCalled();
  });
});
