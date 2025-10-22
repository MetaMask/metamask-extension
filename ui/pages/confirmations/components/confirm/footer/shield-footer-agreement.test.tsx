import React from 'react';
import configureMockStore from 'redux-mock-store';
import { TransactionType } from '@metamask/transaction-controller';

import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { tEn } from '../../../../../../test/lib/i18n-helpers';
import { getMockConfirmStateForTransaction } from '../../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import ShieldFooterAgreement from './shield-footer-agreement';

describe('ShieldFooterAgreement', () => {
  it('renders terms of use link for shield subscription approve', () => {
    const transaction = {
      ...genUnapprovedContractInteractionConfirmation(),
      type: TransactionType.shieldSubscriptionApprove,
    };

    const state = getMockConfirmStateForTransaction(transaction);
    const store = configureMockStore([])(state);

    const { getByText } = renderWithConfirmContextProvider(
      <ShieldFooterAgreement />,
      store,
    );

    expect(getByText(tEn('snapsTermsOfUse') as string)).toBeInTheDocument();
  });
});
