import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PerpsExpandedHeader } from './perps-expanded-header';

jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockUsePerpsLivePrices = jest.fn(() => ({
  prices: {},
  isInitialLoading: false,
}));

jest.mock('../../../../hooks/perps/stream', () => ({
  usePerpsLivePrices: (...args: unknown[]) => mockUsePerpsLivePrices(...args),
}));

jest.mock('../perps-token-logo', () => ({
  PerpsTokenLogo: ({ symbol }: { symbol: string }) => (
    <div data-testid="perps-token-logo" data-symbol={symbol} />
  ),
}));

describe('PerpsExpandedHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePerpsLivePrices.mockReturnValue({
      prices: {},
      isInitialLoading: false,
    });
  });

  it('renders the header container', () => {
    const { getByTestId } = render(
      <PerpsExpandedHeader symbol="ETH" />,
    );
    expect(getByTestId('perps-expanded-header')).toBeInTheDocument();
  });

  it('renders the symbol name with USD suffix', () => {
    render(<PerpsExpandedHeader symbol="ETH" />);
    expect(screen.getByText('ETH-USD')).toBeInTheDocument();
  });

  it('renders maxLeverageLabel when provided', () => {
    render(<PerpsExpandedHeader symbol="ETH" maxLeverageLabel="20x" />);
    expect(screen.getByText('20x')).toBeInTheDocument();
  });

  it('does not render maxLeverageLabel when not provided', () => {
    render(<PerpsExpandedHeader symbol="ETH" />);
    expect(screen.queryByText(/\d+x/u)).not.toBeInTheDocument();
  });

  it('renders the price element', () => {
    mockUsePerpsLivePrices.mockReturnValue({
      prices: {
        ETH: { price: '2850.00', percentChange24h: '+2.56%', symbol: 'ETH' },
      },
      isInitialLoading: false,
    });

    render(<PerpsExpandedHeader symbol="ETH" />);

    expect(screen.getByTestId('perps-expanded-price')).toBeInTheDocument();
  });

  it('renders the change element', () => {
    mockUsePerpsLivePrices.mockReturnValue({
      prices: {
        ETH: { price: '2850.00', percentChange24h: '+2.56%', symbol: 'ETH' },
      },
      isInitialLoading: false,
    });

    render(<PerpsExpandedHeader symbol="ETH" />);

    expect(screen.getByTestId('perps-expanded-change')).toBeInTheDocument();
  });

  it('renders the back button', () => {
    render(<PerpsExpandedHeader symbol="ETH" />);
    expect(screen.getByTestId('perps-expanded-back-button')).toBeInTheDocument();
  });

  it('navigates to the perps tab when back button is clicked', () => {
    render(<PerpsExpandedHeader symbol="ETH" />);
    fireEvent.click(screen.getByTestId('perps-expanded-back-button'));
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'tab=perps' }),
    );
  });

  it('renders the token logo for the symbol', () => {
    const { getByTestId } = render(<PerpsExpandedHeader symbol="BTC" />);
    const logo = getByTestId('perps-token-logo');
    expect(logo).toHaveAttribute('data-symbol', 'BTC');
  });

  it('passes symbols array to usePerpsLivePrices', () => {
    render(<PerpsExpandedHeader symbol="ETH" />);
    expect(mockUsePerpsLivePrices).toHaveBeenCalledWith(
      expect.objectContaining({ symbols: ['ETH'] }),
    );
  });

  it('activates the price stream', () => {
    render(<PerpsExpandedHeader symbol="ETH" />);
    expect(mockUsePerpsLivePrices).toHaveBeenCalledWith(
      expect.objectContaining({ activateStream: true }),
    );
  });
});
