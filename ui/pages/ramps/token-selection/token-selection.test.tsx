import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import TokenSelection from './token-selection';

describe('Ramps TokenSelection (stub)', () => {
  it('renders the placeholder page', () => {
    const { getByTestId } = renderWithProvider(
      <TokenSelection />,
      configureMockStore()({ metamask: {} }),
    );
    expect(getByTestId('ramps-token-selection-page')).toBeInTheDocument();
  });
});
