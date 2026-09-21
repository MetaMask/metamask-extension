/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, fireEvent } from '@testing-library/react';
import configureStore from '../../../../store/store';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import RampsQuoteDisplay from './ramps-quote-display';

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

describe('RampsQuoteDisplay', () => {
  it('matches snapshot while loading', () => {
    const { container } = renderWithProvider(
      <RampsQuoteDisplay cryptoAmount="" fiatAmount={null} isLoading />,
      createStore(),
    );

    expect(container).toMatchSnapshot();
  });

  it('matches snapshot with crypto and fiat amounts', () => {
    const { container } = renderWithProvider(
      <RampsQuoteDisplay cryptoAmount="0.10596 ETH" fiatAmount="$499.97" />,
      createStore(),
    );

    expect(container).toMatchSnapshot();
  });

  it('matches snapshot with warning icon', () => {
    const { container } = renderWithProvider(
      <RampsQuoteDisplay cryptoAmount="" fiatAmount={null} showWarningIcon />,
      createStore(),
    );

    expect(container).toMatchSnapshot();
  });

  it('matches snapshot when empty', () => {
    const { container } = renderWithProvider(
      <RampsQuoteDisplay cryptoAmount="" fiatAmount={null} />,
      createStore(),
    );

    expect(container).toMatchSnapshot();
  });

  it('shows the warning message in a tooltip while hovering the warning icon', async () => {
    const { getByTestId, queryByTestId } = renderWithProvider(
      <RampsQuoteDisplay
        cryptoAmount=""
        fiatAmount={null}
        showWarningIcon
        warningMessage="Quote unavailable."
      />,
      createStore(),
    );

    expect(
      queryByTestId('ramps-quote-display-warning-tooltip'),
    ).not.toBeInTheDocument();

    await act(async () => {
      fireEvent.mouseEnter(getByTestId('ramps-quote-display-warning-trigger'));
    });

    expect(
      getByTestId('ramps-quote-display-warning-tooltip'),
    ).toHaveTextContent('Quote unavailable.');

    await act(async () => {
      fireEvent.mouseLeave(getByTestId('ramps-quote-display-warning-trigger'));
    });

    expect(
      queryByTestId('ramps-quote-display-warning-tooltip'),
    ).not.toBeInTheDocument();
  });
});
