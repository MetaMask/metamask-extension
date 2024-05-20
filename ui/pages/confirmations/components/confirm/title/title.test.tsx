import React from 'react';
import configureMockStore from 'redux-mock-store';
import { TransactionType } from '@metamask/transaction-controller';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import { Confirmation } from '../../../types/confirm';
import ConfirmTitle from './title';

const genMockState = (confirmationOverride: Partial<Confirmation> = {}) => ({
  confirm: {
    currentConfirmation: {
      type: TransactionType.personalSign,
      ...confirmationOverride,
    },
  },
});

describe('ConfirmTitle', () => {
  it('should render the title and description for a personal signature', () => {
    const mockStore = configureMockStore([])(
      genMockState({ type: TransactionType.personalSign }),
    );
    const { getByText } = renderWithProvider(<ConfirmTitle />, mockStore);

    expect(getByText('Signature request')).toBeInTheDocument();
    expect(
      getByText(
        'Only confirm this message if you approve the content and trust the requesting site.',
      ),
    ).toBeInTheDocument();
  });

  it('should render the title and description for typed signature', () => {
    const mockStore = configureMockStore([])(
      genMockState({ type: TransactionType.signTypedData }),
    );
    const { getByText } = renderWithProvider(<ConfirmTitle />, mockStore);

    expect(getByText('Signature request')).toBeInTheDocument();
    expect(
      getByText(
        'Only confirm this message if you approve the content and trust the requesting site.',
      ),
    ).toBeInTheDocument();
  });

  it('should render the title and description for a contract interaction transaction', () => {
    const mockStore = configureMockStore([])(
      genMockState({ type: TransactionType.contractInteraction }),
    );
    const { getByText } = renderWithProvider(<ConfirmTitle />, mockStore);

    expect(getByText('Transaction request')).toBeInTheDocument();
    expect(
      getByText(
        'Only confirm this transaction if you fully understand the content and trust the requesting site.',
      ),
    ).toBeInTheDocument();
  });
});
