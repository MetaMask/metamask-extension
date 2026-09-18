import React from 'react';
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
import { AdvancedDetailsButton } from './advanced-details-button';

const defaultState = getMockTokenTransferConfirmState({});

const render = (state: Record<string, unknown> = defaultState) => {
  const store = configureStore(state);
  return renderWithConfirmContextProvider(<AdvancedDetailsButton />, store);
};

const getPerpsWithdrawState = () => {
  const base = genUnapprovedContractInteractionConfirmation({ chainId: '0x1' });
  return getMockConfirmStateForTransaction({
    ...base,
    type: TransactionType.perpsWithdraw,
    origin: 'metamask',
  } as TransactionMeta);
};

describe('<AdvancedDetailsButton />', () => {
  it('should match snapshot', async () => {
    const { container } = render();

    expect(container).toMatchSnapshot();
  });

  it('hides the button visually for perpsWithdraw transactions', () => {
    const { getByTestId } = render(getPerpsWithdrawState());

    const button = getByTestId('header-advanced-details-button');
    expect(button.closest('[style*="visibility"]')).toHaveStyle({
      visibility: 'hidden',
    });
  });

  it('keeps the button visible for non-hidden transaction types', () => {
    const { getByTestId } = render();

    const button = getByTestId('header-advanced-details-button');
    expect(button.closest('[style*="visibility"]')).toBeNull();
  });
});
