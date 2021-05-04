import React from 'react';
import configureMockStore from 'redux-mock-store';

import {
  renderWithProvider,
  createSwapsMockStore,
} from '../../../../test/jest';
import AwaitingSignatures from '.';

describe('AwaitingSignatures', () => {
  it('renders the component with initial props', () => {
    const store = configureMockStore()(createSwapsMockStore());
    const { getByText, getAllByText } = renderWithProvider(
      <AwaitingSignatures />,
      store,
    );
    expect(getByText('2 transactions')).toBeInTheDocument();
    expect(
      getByText('to confirm with your hardware wallet'),
    ).toBeInTheDocument();
    expect(getByText('Allow swapping of')).toBeInTheDocument();
    expect(getByText('BAT')).toBeInTheDocument();
    expect(getAllByText('ETH')).toHaveLength(2);
    expect(
      getByText(
        'Gas fees on the previous screen are split between these two transactions.',
      ),
    ).toBeInTheDocument();
    expect(document.querySelector('.swaps-footer')).toMatchSnapshot();
  });
});
