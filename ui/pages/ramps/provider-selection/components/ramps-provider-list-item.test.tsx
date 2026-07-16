/**
 * @jest-environment jsdom
 */
import React from 'react';
import { screen } from '@testing-library/react';
import type { Provider, Quote } from '@metamask/ramps-controller';
import configureStore from '../../../../store/store';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import RampsProviderListItem from './ramps-provider-list-item';

const createStore = () =>
  configureStore({
    metamask: {
      selectedNetworkClientId: 'mainnet',
      networkConfigurationsByChainId: {
        '0x1': { chainId: '0x1', name: 'Ethereum Mainnet' },
      },
      currentCurrency: 'usd',
      internalAccounts: {
        selectedAccount: 'account-1',
        accounts: {
          'account-1': {
            id: 'account-1',
            address: '0xabc123',
            metadata: { name: 'Account 1' },
          },
        },
      },
    },
  });

const provider = {
  id: '/providers/transak',
  name: 'Transak',
  logos: {
    light: '/assets/providers/transak_light.png',
    dark: '/assets/providers/transak_dark.png',
    height: 24,
    width: 90,
  },
} as unknown as Provider;

const mockQuote: Quote = {
  provider: provider.id,
  quote: {
    amountIn: 100,
    amountOut: '0.05',
    paymentMethod: 'debit-credit-card',
    amountOutInFiat: 99.5,
  },
};

describe('RampsProviderListItem', () => {
  it('matches snapshot when selected with quote', () => {
    const { container } = renderWithProvider(
      <RampsProviderListItem
        provider={provider}
        isSelected
        subtitle="Best rate"
        showQuote
        quote={mockQuote}
        currency="USD"
        tokenSymbol="ETH"
        onClick={jest.fn()}
      />,
      createStore(),
    );

    expect(container).toMatchSnapshot();
  });

  it('renders the provider wordmark with content CDN prefix', () => {
    renderWithProvider(
      <RampsProviderListItem provider={provider} onClick={jest.fn()} />,
      createStore(),
    );

    const logo = screen.getByTestId(
      'ramps-provider-item-logo-/providers/transak',
    );
    expect(logo).toHaveAttribute(
      'src',
      'https://on-ramp-content.uat-api.cx.metamask.io/assets/providers/transak_light.png',
    );
    expect(logo).toHaveAttribute('alt', 'Transak');
  });

  it('matches snapshot when unavailable', () => {
    const { container } = renderWithProvider(
      <RampsProviderListItem
        provider={provider}
        isDisabled
        subtitle="Quote unavailable."
        showQuote
        onClick={jest.fn()}
      />,
      createStore(),
    );

    expect(container).toMatchSnapshot();
  });

  it('matches snapshot while quote is loading', () => {
    const { container } = renderWithProvider(
      <RampsProviderListItem
        provider={provider}
        showQuote
        quoteLoading
        onClick={jest.fn()}
      />,
      createStore(),
    );

    expect(container).toMatchSnapshot();
  });

  it('matches snapshot when logos are missing', () => {
    const providerWithoutLogos = {
      id: '/providers/transak',
      name: 'Transak',
    } as unknown as Provider;

    const { container } = renderWithProvider(
      <RampsProviderListItem
        provider={providerWithoutLogos}
        onClick={jest.fn()}
      />,
      createStore(),
    );

    expect(container).toMatchSnapshot();
  });
});
