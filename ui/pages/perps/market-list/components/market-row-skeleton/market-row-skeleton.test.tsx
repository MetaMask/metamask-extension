import React from 'react';
import { render, screen } from '@testing-library/react';
import { MarketRowSkeleton } from './market-row-skeleton';

describe('MarketRowSkeleton', () => {
  it('renders the market row skeleton', () => {
    render(<MarketRowSkeleton />);

    expect(screen.getByTestId('market-row-skeleton')).toBeInTheDocument();
  });

  it('uses bg-default to match MarketRow in pure black theme', () => {
    render(<MarketRowSkeleton />);

    expect(screen.getByTestId('market-row-skeleton')).toHaveClass('bg-default');
  });
});
