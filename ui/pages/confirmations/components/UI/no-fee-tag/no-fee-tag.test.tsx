import React from 'react';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../../../test/lib/i18n-helpers';
import configureStore from '../../../../../store/store';
import mockState from '../../../../../../test/data/mock-state.json';
import { NoFeeTag } from './no-fee-tag';

describe('NoFeeTag', () => {
  it('renders the No fee label', () => {
    const store = configureStore(mockState);
    const { getByTestId, getByText } = renderWithProvider(<NoFeeTag />, store);

    expect(getByTestId('no-fee-tag')).toBeInTheDocument();
    expect(getByText(messages.noFee.message)).toBeInTheDocument();
  });
});
