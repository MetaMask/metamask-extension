import React from 'react';
import { DefaultRootState } from 'react-redux';
import { fireEvent } from '@testing-library/react';
import { TransactionType } from '@metamask/transaction-controller';

import { getMockConfirmStateForTransaction } from '../../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import configureStore from '../../../../../store/store';
import * as ConfirmActions from '../../../hooks/useConfirmActions';
import { SimpleConfirmationHeader } from './simple-confirmation-header';

function genConfirmation(type: TransactionType = TransactionType.musdConversion) {
  const base = genUnapprovedContractInteractionConfirmation({
    chainId: '0x1',
  });
  return {
    ...base,
    type,
    origin: 'metamask',
  };
}

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

function render(
  type: TransactionType = TransactionType.musdConversion,
  state?: DefaultRootState,
) {
  const store = configureStore(
    state ?? getMockConfirmStateForTransaction(genConfirmation(type)),
  );
  return renderWithConfirmContextProvider(<SimpleConfirmationHeader />, store);
}

describe('<SimpleConfirmationHeader />', () => {
  it('renders the back button', () => {
    const { getByTestId } = render();

    expect(
      getByTestId('simple-confirmation-header-back-button'),
    ).toBeInTheDocument();
  });

  it('calls onCancel with navigateBackToPreviousPage when back button is pressed', () => {
    const mockOnCancel = jest.fn();
    jest.spyOn(ConfirmActions, 'useConfirmActions').mockImplementation(() => ({
      onCancel: mockOnCancel,
      resetTransactionState: jest.fn(),
    }));

    const { getByTestId } = render();
    fireEvent.click(getByTestId('simple-confirmation-header-back-button'));

    expect(mockOnCancel).toHaveBeenCalledWith({
      location: 'confirmation',
      navigateBackToPreviousPage: true,
    });
  });

  describe('musdConversion type', () => {
    it('renders the "Convert and get 3%" title', () => {
      const { getByTestId } = render(TransactionType.musdConversion);

      expect(
        getByTestId('simple-confirmation-header-title'),
      ).toHaveTextContent('Convert and get 3%');
    });

    it('renders the mUSD info tooltip as endAccessory', () => {
      const { getByTestId } = render(TransactionType.musdConversion);

      expect(
        getByTestId('musd-conversion-header-info-button'),
      ).toBeInTheDocument();
    });

    it('shows tooltip when info button is clicked', () => {
      const { getByTestId } = render(TransactionType.musdConversion);

      fireEvent.click(getByTestId('musd-conversion-header-info-button'));

      expect(
        getByTestId('musd-conversion-header-tooltip'),
      ).toBeInTheDocument();
    });
  });
});
