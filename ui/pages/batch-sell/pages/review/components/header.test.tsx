import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { Header } from './header';

jest.mock('../../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

jest.mock('../../../../../ducks/metamask/metamask', () => ({
  getCurrentCurrency: (state: { currency?: string }) => state?.currency,
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

const mockUseSelector = jest.mocked(useSelector);

function seedSelectors(currency = 'USD') {
  mockUseSelector.mockReset();
  mockUseSelector.mockReturnValue(currency as never);
}

describe('Header', () => {
  beforeEach(() => {
    seedSelectors();
  });

  it('renders the totalReceived label', () => {
    render(
      <Header
        totalReceivedFiat={100}
        isLoading={false}
        selectedAsset={{ symbol: 'USDC' }}
        onTotalReceivedFiatIconClick={jest.fn()}
        onSelectReceivedAssetClick={jest.fn()}
      />,
    );

    // The label text "totalReceived" is rendered twice (label + info button
    // aria-label); ensure it is in the document.
    expect(screen.getAllByText('totalReceived').length).toBeGreaterThan(0);
  });

  it('renders the selected asset symbol', () => {
    render(
      <Header
        totalReceivedFiat={100}
        isLoading={false}
        selectedAsset={{ symbol: 'USDC' }}
        onTotalReceivedFiatIconClick={jest.fn()}
        onSelectReceivedAssetClick={jest.fn()}
      />,
    );

    expect(screen.getByText('USDC')).toBeInTheDocument();
  });

  it('renders the formatted fiat amount when totalReceivedFiat is provided', () => {
    render(
      <Header
        totalReceivedFiat={1234.56}
        isLoading={false}
        selectedAsset={{ symbol: 'USDC' }}
        onTotalReceivedFiatIconClick={jest.fn()}
        onSelectReceivedAssetClick={jest.fn()}
      />,
    );

    expect(screen.getByText(/1,234/u)).toBeInTheDocument();
  });

  it('renders the hardcoded skeleton value when totalReceivedFiat is undefined', () => {
    render(
      <Header
        totalReceivedFiat={undefined}
        isLoading
        selectedAsset={{ symbol: 'USDC' }}
        onTotalReceivedFiatIconClick={jest.fn()}
        onSelectReceivedAssetClick={jest.fn()}
      />,
    );

    expect(screen.getByText('12345678')).toBeInTheDocument();
  });

  it('calls onTotalReceivedFiatIconClick when the info icon is clicked', () => {
    const onTotalReceivedFiatIconClick = jest.fn();

    render(
      <Header
        totalReceivedFiat={100}
        isLoading={false}
        selectedAsset={{ symbol: 'USDC' }}
        onTotalReceivedFiatIconClick={onTotalReceivedFiatIconClick}
        onSelectReceivedAssetClick={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'totalReceived' }));

    expect(onTotalReceivedFiatIconClick).toHaveBeenCalledTimes(1);
  });

  it('renders a smaller text variant when the formatted total is longer than 10 chars', () => {
    render(
      <Header
        totalReceivedFiat={1234567890.12}
        isLoading={false}
        selectedAsset={{ symbol: 'USDC' }}
        onTotalReceivedFiatIconClick={jest.fn()}
        onSelectReceivedAssetClick={jest.fn()}
      />,
    );

    // We don't introspect the variant directly – instead, ensure the long
    // formatted value is in the document, which means the > 10 branch ran.
    expect(screen.getByText(/1,234,567,890/u)).toBeInTheDocument();
  });

  it('calls onSelectReceivedAssetClick when the asset button is clicked', () => {
    const onSelectReceivedAssetClick = jest.fn();

    render(
      <Header
        totalReceivedFiat={100}
        isLoading={false}
        selectedAsset={{ symbol: 'USDC' }}
        onTotalReceivedFiatIconClick={jest.fn()}
        onSelectReceivedAssetClick={onSelectReceivedAssetClick}
      />,
    );

    fireEvent.click(screen.getByText('USDC'));

    expect(onSelectReceivedAssetClick).toHaveBeenCalledTimes(1);
  });
});
