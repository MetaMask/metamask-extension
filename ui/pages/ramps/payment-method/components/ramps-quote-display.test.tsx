/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureStore from '../../../../store/store';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import RampsQuoteDisplay, {
  interestInvokerSupport,
} from './ramps-quote-display';

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

  it('opens a fallback tooltip on hover and focus when interest invokers are unsupported', () => {
    const { getByTestId, queryByTestId } = renderWithProvider(
      <RampsQuoteDisplay
        cryptoAmount=""
        fiatAmount={null}
        showWarningIcon
        warningMessage="Quote unavailable."
      />,
      createStore(),
    );

    const trigger = getByTestId('ramps-quote-display-warning-trigger');
    const warning = getByTestId('ramps-quote-display-warning');

    expect(trigger).not.toHaveAttribute('interestfor');
    expect(queryByTestId('ramps-quote-display-warning-tooltip')).toBeNull();

    fireEvent.mouseEnter(warning);
    let tooltip = getByTestId('ramps-quote-display-warning-tooltip');
    expect(tooltip).toHaveTextContent('Quote unavailable.');
    expect(trigger).toHaveAttribute('aria-describedby', tooltip.id);

    fireEvent.mouseLeave(warning);
    expect(queryByTestId('ramps-quote-display-warning-tooltip')).toBeNull();

    fireEvent.focus(trigger);
    tooltip = getByTestId('ramps-quote-display-warning-tooltip');
    expect(tooltip).toHaveTextContent('Quote unavailable.');
    expect(trigger).toHaveAttribute('aria-describedby', tooltip.id);

    fireEvent.blur(trigger);
    expect(queryByTestId('ramps-quote-display-warning-tooltip')).toBeNull();
  });

  it('associates the warning icon with a native tooltip when interest invokers are supported', () => {
    interestInvokerSupport.detected = true;
    try {
      const { getByTestId } = renderWithProvider(
        <RampsQuoteDisplay
          cryptoAmount=""
          fiatAmount={null}
          showWarningIcon
          warningMessage="Quote unavailable."
        />,
        createStore(),
      );

      const trigger = getByTestId('ramps-quote-display-warning-trigger');
      const tooltip = getByTestId('ramps-quote-display-warning-tooltip');

      expect(trigger).toHaveAttribute('interestfor', tooltip.id);
      expect(trigger.tagName).toBe('BUTTON');
      expect(trigger).not.toHaveAttribute('aria-describedby');
      expect(tooltip).toHaveAttribute('popover', 'hint');
      expect(tooltip).toHaveTextContent('Quote unavailable.');
    } finally {
      interestInvokerSupport.detected = false;
    }
  });
});
