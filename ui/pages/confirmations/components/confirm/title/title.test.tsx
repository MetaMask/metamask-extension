import React from 'react';
import configureMockStore from 'redux-mock-store';
import { TransactionType } from '@metamask/transaction-controller';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import ConfirmTitle from './title';

const mockState = {
  confirm: {
    currentConfirmation: {
      type: TransactionType.personalSign,
    },
  },
};

describe('ConfirmTitle', () => {
  it('should render the title and description', () => {
    const mockStore = configureMockStore([])(mockState);
    const { getByText } = renderWithProvider(<ConfirmTitle />, mockStore);

    expect(getByText('Signature request')).toBeInTheDocument();
    expect(
      getByText(
        'Only sign this message if you fully understand the content and trust the requesting site',
      ),
    ).toBeInTheDocument();
  });
});
