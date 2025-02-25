import React from 'react';
import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AggregatedBalance } from './aggregated-balance';
import { renderWithProvider } from '../../../../test/lib/render-helpers';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

const mockState = {};

describe('AggregatedBalance Component', () => {
  it.skip('renders Spinner when balances are missing', () => {
    const { container } = renderWithProvider(
      <AggregatedBalance
        classPrefix="test"
        balanceIsCached={false}
        handleSensitiveToggle={jest.fn()}
      />,
      mockState, // Ensure mockStore is correctly defined
    );

    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });
});
