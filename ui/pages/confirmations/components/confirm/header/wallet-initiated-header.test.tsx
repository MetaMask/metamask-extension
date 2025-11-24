import React from 'react';
import { DefaultRootState } from 'react-redux';
import { fireEvent } from '@testing-library/react';

import { getMockTokenTransferConfirmState } from '../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import configureStore from '../../../../../store/store';
import * as RedesignedSendFlow from '../../../hooks/useRedesignedSendFlow';
import * as ConfirmActions from '../../../hooks/useConfirmActions';
import { WalletInitiatedHeader } from './wallet-initiated-header';

const render = (
  state: DefaultRootState = getMockTokenTransferConfirmState({}),
) => {
  const store = configureStore(state);
  return renderWithConfirmContextProvider(<WalletInitiatedHeader />, store);
};

jest.mock('../../../hooks/useRedesignedSendFlow', () => ({
  useRedesignedSendFlow: jest.fn().mockReturnValue({ enabled: false }),
}));

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
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
    jest.spyOn(RedesignedSendFlow, 'useRedesignedSendFlow').mockReturnValue({
      enabled: true,
    });
    const { getByTestId } = render(
      getMockTokenTransferConfirmState({ isWalletInitiatedConfirmation: true }),
    );
    fireEvent.click(getByTestId('wallet-initiated-header-back-button'));
    expect(mockOnCancel).toHaveBeenCalled();
  });
});
