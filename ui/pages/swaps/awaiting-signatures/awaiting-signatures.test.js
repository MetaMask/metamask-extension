import React from 'react';
import configureMockStore from 'redux-mock-store';
import { createSwapsMockStore } from '../../../../test/jest';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import AwaitingSignatures from '.';

describe('AwaitingSignatures', () => {
  it('renders the component with initial props for 1 confirmation', () => {
    const store = configureMockStore()(createSwapsMockStore());
    const { getByText } = renderWithProvider(<AwaitingSignatures />, store);
    expect(getByText('Confirm with your hardware wallet')).toBeInTheDocument();
    expect(getByText('Cancel')).toBeInTheDocument();
  });
});
