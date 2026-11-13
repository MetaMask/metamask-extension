import React from 'react';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../../../test/lib/i18n-helpers';
import configureStore from '../../../../../store/store';
import mockState from '../../../../../../test/data/mock-state.json';
import { NoDepositFeeTag, NoFeeTag } from './no-fee-tag';

describe('NoFeeTag', () => {
  it('renders the No fee label', () => {
    const store = configureStore(mockState);
    const { getByTestId, getByText } = renderWithProvider(<NoFeeTag />, store);

    expect(getByTestId('no-fee-tag')).toBeInTheDocument();
    expect(getByText(messages.noFee.message)).toBeInTheDocument();
  });

  it('does not allow the label to wrap', () => {
    const store = configureStore(mockState);
    const { getByTestId } = renderWithProvider(<NoFeeTag />, store);

    expect(getByTestId('no-fee-tag')).toHaveClass(
      'shrink-0',
      'whitespace-nowrap',
    );
  });
});

describe('NoDepositFeeTag', () => {
  it('renders the No deposit fee label', () => {
    const store = configureStore(mockState);
    const { getByTestId, getByText } = renderWithProvider(
      <NoDepositFeeTag />,
      store,
    );

    expect(getByTestId('no-deposit-fee-tag')).toBeInTheDocument();
    expect(getByText(messages.noDepositFee.message)).toBeInTheDocument();
  });
});
