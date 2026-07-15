import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import BuildQuote from './build-quote';

describe('Ramps BuildQuote (stub)', () => {
  it('renders the placeholder page', () => {
    const { getByTestId } = renderWithProvider(
      <BuildQuote />,
      configureMockStore()({ metamask: {} }),
    );
    expect(getByTestId('ramps-build-quote-page')).toBeInTheDocument();
  });
});
