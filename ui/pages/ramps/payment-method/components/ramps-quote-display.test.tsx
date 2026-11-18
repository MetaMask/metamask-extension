/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
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

  it('opens a fallback tooltip on hover and focus when interest invokers are unsupported', async () => {
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
    const tooltip = getByTestId('ramps-quote-display-warning-tooltip');
    expect(tooltip).toHaveTextContent('Quote unavailable.');
    expect(trigger).toHaveAttribute('aria-describedby', tooltip.id);

    // Moving onto the tooltip keeps it open during the grace period.
    fireEvent.mouseLeave(warning);
    fireEvent.mouseEnter(tooltip);
    expect(
      getByTestId('ramps-quote-display-warning-tooltip'),
    ).toHaveTextContent('Quote unavailable.');

    // Leaving the tooltip closes it after the grace period.
    fireEvent.mouseLeave(tooltip);
    await waitFor(() =>
      expect(queryByTestId('ramps-quote-display-warning-tooltip')).toBeNull(),
    );

    // Escape dismisses the tooltip while it is open.
    fireEvent.focus(trigger);
    expect(
      getByTestId('ramps-quote-display-warning-tooltip'),
    ).toHaveTextContent('Quote unavailable.');
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() =>
      expect(queryByTestId('ramps-quote-display-warning-tooltip')).toBeNull(),
    );
    expect(trigger).not.toHaveAttribute('aria-describedby');
  });

  it('keeps the fallback tooltip open when the trigger blurs while hovered', async () => {
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

    fireEvent.focus(trigger);
    const tooltip = getByTestId('ramps-quote-display-warning-tooltip');

    // Pointer moves onto the tooltip while the trigger is still focused.
    fireEvent.mouseEnter(tooltip);

    // Clicking the tooltip blurs the trigger, but the pointer is still over
    // the tooltip, so it stays open.
    fireEvent.blur(trigger);
    expect(
      getByTestId('ramps-quote-display-warning-tooltip'),
    ).toHaveTextContent('Quote unavailable.');

    // Once the pointer leaves too, the tooltip closes after the grace period.
    fireEvent.mouseLeave(tooltip);
    await waitFor(() =>
      expect(queryByTestId('ramps-quote-display-warning-tooltip')).toBeNull(),
    );
  });

  it('closes the fallback tooltip on blur after Escape dismissed it while hovered', async () => {
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

    // Pointer is over the tooltip (hovering the icon, then onto the tooltip).
    fireEvent.mouseEnter(warning);
    const tooltip = getByTestId('ramps-quote-display-warning-tooltip');
    fireEvent.mouseEnter(tooltip);
    fireEvent.focus(trigger);

    // Escape dismisses the tooltip; it unmounts without a mouseleave, so the
    // hover state must be reset by the dismissal.
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() =>
      expect(queryByTestId('ramps-quote-display-warning-tooltip')).toBeNull(),
    );

    // Re-opening via focus and then blurring must be able to close it again.
    fireEvent.focus(trigger);
    expect(
      getByTestId('ramps-quote-display-warning-tooltip'),
    ).toHaveTextContent('Quote unavailable.');
    fireEvent.blur(trigger);
    await waitFor(() =>
      expect(queryByTestId('ramps-quote-display-warning-tooltip')).toBeNull(),
    );
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
