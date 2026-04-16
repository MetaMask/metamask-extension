import React from 'react';
import { DefaultRootState } from 'react-redux';
import { fireEvent } from '@testing-library/react';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';

import {
  getMockConfirmStateForTransaction,
  getMockTokenTransferConfirmState,
} from '../../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import configureStore from '../../../../../store/store';
import * as ConfirmActions from '../../../hooks/useConfirmActions';
import { tEn } from '../../../../../../test/lib/i18n-helpers';
import { WalletInitiatedHeader } from './wallet-initiated-header';

/** Build a confirm state for a perpsDeposit transaction. */
const getPerpsDepositState = () => {
  const base = genUnapprovedContractInteractionConfirmation({ chainId: '0x1' });
  return getMockConfirmStateForTransaction({
    ...base,
    type: TransactionType.perpsDeposit,
    origin: 'metamask',
  } as TransactionMeta);
};

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

  it('calls onCancel with navigateBackToPreviousPage for musdClaim', () => {
    const mockOnCancel = jest.fn();
    jest.spyOn(ConfirmActions, 'useConfirmActions').mockImplementation(() => ({
      onCancel: mockOnCancel,
      resetTransactionState: jest.fn(),
    }));

    const base = genUnapprovedContractInteractionConfirmation({
      chainId: '0x1',
    });
    const musdClaimState = getMockConfirmStateForTransaction({
      ...base,
      type: TransactionType.musdClaim,
      origin: 'metamask',
    } as TransactionMeta);

    const { getByTestId } = render(musdClaimState);
    fireEvent.click(getByTestId('wallet-initiated-header-back-button'));

    expect(mockOnCancel).toHaveBeenCalledWith({
      location: 'confirmation',
      navigateBackToPreviousPage: true,
    });
  });

  it('calls onCancel with navigateBackToPreviousPage for perpsDeposit', () => {
    const mockOnCancel = jest.fn();
    jest.spyOn(ConfirmActions, 'useConfirmActions').mockImplementation(() => ({
      onCancel: mockOnCancel,
      resetTransactionState: jest.fn(),
    }));

    const { getByTestId } = render(getPerpsDepositState());
    fireEvent.click(getByTestId('wallet-initiated-header-back-button'));

    expect(mockOnCancel).toHaveBeenCalledWith({
      location: 'confirmation',
      navigateBackToPreviousPage: true,
    });
  });

  it('shows perpsDepositFundsTitle as the header title for perpsDeposit', () => {
    const { getByText } = render(getPerpsDepositState());

    expect(getByText(tEn('perpsDepositFundsTitle'))).toBeInTheDocument();
  });

  it('hides AdvancedDetailsButton visually for perpsDeposit', () => {
    const { getByTestId } = render(getPerpsDepositState());

    const advancedButton = getByTestId('header-advanced-details-button');
    expect(advancedButton.closest('[style*="visibility"]')).toHaveStyle({
      visibility: 'hidden',
    });
  });

  it('shows AdvancedDetailsButton for non-perpsDeposit transactions', () => {
    const { getByTestId } = render();

    expect(getByTestId('header-advanced-details-button')).toBeInTheDocument();
  });
});
