import React from 'react';
import { DefaultRootState } from 'react-redux';
import { fireEvent } from '@testing-library/react';

import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import {
  getMockConfirmStateForTransaction,
  getMockTokenTransferConfirmState,
} from '../../../../../../test/data/confirmations/helper';
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

  it('calls onCancel without navigateBackForSend for musdClaim back button', () => {
    const mockOnCancel = jest.fn();
    jest.spyOn(ConfirmActions, 'useConfirmActions').mockImplementation(() => ({
      onCancel: mockOnCancel,
      resetTransactionState: jest.fn(),
    }));

    const musdClaimState = getMockConfirmStateForTransaction({
      id: 'musd-claim-id',
      chainId: '0xe708',
      type: TransactionType.musdClaim,
      status: TransactionStatus.unapproved,
      time: Date.now(),
      origin: 'metamask',
      txParams: {
        from: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
        to: '0x1234567890abcdef1234567890abcdef12345678',
        value: '0x0',
      },
    } as Parameters<typeof getMockConfirmStateForTransaction>[0]);

    const { getByTestId } = render(musdClaimState);
    fireEvent.click(getByTestId('wallet-initiated-header-back-button'));

    expect(mockOnCancel).toHaveBeenCalledWith(
      expect.objectContaining({ location: 'confirmation' }),
    );
    expect(mockOnCancel).not.toHaveBeenCalledWith(
      expect.objectContaining({ navigateBackForSend: true }),
    );
  });
});
