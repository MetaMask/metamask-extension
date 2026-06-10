import React from 'react';
import { render, screen } from '@testing-library/react';
import { Header } from './header';

jest.mock('../../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

describe('Header', () => {
  it('renders the container with the correct test id', () => {
    render(<Header />);

    expect(screen.getByTestId('batch-sell-select-header')).toBeInTheDocument();
  });

  it('renders the title', () => {
    render(<Header />);

    expect(screen.getByText('batchSellSelectHeaderTitle')).toBeInTheDocument();
  });

  it('renders the subtitle', () => {
    render(<Header />);

    expect(
      screen.getByText('batchSellSelectHeaderSubtitle'),
    ).toBeInTheDocument();
  });
});
