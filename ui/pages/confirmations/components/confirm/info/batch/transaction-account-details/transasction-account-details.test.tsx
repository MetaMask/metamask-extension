import React from 'react';

import configureStore from '../../../../../../../store/store';
import {
  downgradeAccountConfirmation,
  upgradeAccountConfirmation,
} from '../../../../../../../../test/data/confirmations/batch-transaction';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import { getMockConfirmStateForTransaction } from '../../../../../../../../test/data/confirmations/helper';
import { Confirmation } from '../../../../../types/confirm';
import { TransactionAccountDetails } from './transaction-account-details';

function render(confirmation: Confirmation) {
  const store = configureStore(getMockConfirmStateForTransaction(confirmation));
  return renderWithConfirmContextProvider(<TransactionAccountDetails />, store);
}

describe('TransactionAccountDetails', () => {
  it('renders required data for upgrade request', () => {
    const { getByText } = render(upgradeAccountConfirmation as Confirmation);
    expect(getByText('0x8a0bb...bDB87')).toBeInTheDocument();
    expect(getByText('Standard account')).toBeInTheDocument();
    expect(getByText('Smart contract')).toBeInTheDocument();
  });

  it('renders required data for revoke request', () => {
    const { getByText } = render(downgradeAccountConfirmation as Confirmation);
    expect(getByText('0x8a0bb...bDB87')).toBeInTheDocument();
    expect(getByText('Standard account')).toBeInTheDocument();
    expect(getByText('Smart account')).toBeInTheDocument();
  });
});
