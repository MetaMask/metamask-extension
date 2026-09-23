/**
 * @jest-environment jsdom
 */
import React from 'react';
import type { PaymentMethod, Quote } from '@metamask/ramps-controller';
import { act, fireEvent } from '@testing-library/react';
import configureStore from '../../../../store/store';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import RampsPaymentMethodListItem from './ramps-payment-method-list-item';

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

const debitCard: PaymentMethod = {
  id: 'debit-credit-card',
  paymentType: 'debit-credit-card',
  name: 'Debit card',
  score: 1,
  icon: 'card',
  delay: [5, 10],
};

const bankTransfer: PaymentMethod = {
  id: 'bank-transfer',
  paymentType: 'bank-transfer',
  name: 'Bank transfer',
  score: 0,
  icon: 'bank',
  delay: [0, 0],
};

const mockQuote: Quote = {
  provider: '/providers/test',
  quote: {
    amountIn: 500,
    amountOut: '0.10596',
    paymentMethod: debitCard.id,
    amountOutInFiat: 499.97,
  },
};

describe('RampsPaymentMethodListItem', () => {
  it('matches snapshot with delay and limits', () => {
    const { container } = renderWithProvider(
      <RampsPaymentMethodListItem
        paymentMethod={debitCard}
        isSelected
        limitText="Up to $2,000"
        onClick={jest.fn()}
      />,
      createStore(),
    );

    expect(container).toMatchSnapshot();
  });

  it('matches snapshot with instant delay and no limits', () => {
    const { container } = renderWithProvider(
      <RampsPaymentMethodListItem
        paymentMethod={bankTransfer}
        onClick={jest.fn()}
      />,
      createStore(),
    );

    expect(container).toMatchSnapshot();
  });

  it('matches snapshot with quote amounts', () => {
    const { container } = renderWithProvider(
      <RampsPaymentMethodListItem
        paymentMethod={debitCard}
        isSelected
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

  it('matches snapshot while quote is loading', () => {
    const { container } = renderWithProvider(
      <RampsPaymentMethodListItem
        paymentMethod={debitCard}
        showQuote
        quoteLoading
        quote={null}
        currency="USD"
        tokenSymbol="ETH"
        onClick={jest.fn()}
      />,
      createStore(),
    );

    expect(container).toMatchSnapshot();
  });

  it('matches snapshot with quote error', () => {
    const { container } = renderWithProvider(
      <RampsPaymentMethodListItem
        paymentMethod={debitCard}
        showQuote
        quoteError
        quoteErrorMessage="Minimum purchase is $25.00"
        quote={null}
        isDisabled
        currency="USD"
        tokenSymbol="ETH"
        onClick={jest.fn()}
      />,
      createStore(),
    );

    expect(container).toMatchSnapshot();
  });

  it('matches snapshot when showQuote with no matched quote amounts', () => {
    const { container } = renderWithProvider(
      <RampsPaymentMethodListItem
        paymentMethod={debitCard}
        showQuote
        quote={null}
        currency="USD"
        tokenSymbol="ETH"
        onClick={jest.fn()}
      />,
      createStore(),
    );

    expect(container).toMatchSnapshot();
  });

  it('shows the quote error message when hovering the warning icon', async () => {
    const { getByTestId, queryByTestId } = renderWithProvider(
      <RampsPaymentMethodListItem
        paymentMethod={debitCard}
        showQuote
        quoteError
        quoteErrorMessage="Minimum purchase is $25.00"
        quote={null}
        isDisabled
        currency="USD"
        tokenSymbol="ETH"
        onClick={jest.fn()}
      />,
      createStore(),
    );

    const trigger = getByTestId('ramps-quote-display-warning-trigger');

    expect(trigger).not.toHaveAttribute('interestfor');
    expect(queryByTestId('ramps-quote-display-warning-tooltip')).toBeNull();

    await act(async () => {
      fireEvent.focus(trigger);
    });

    const tooltip = getByTestId('ramps-quote-display-warning-tooltip');
    expect(tooltip).toHaveTextContent('Minimum purchase is $25.00');
    expect(trigger).toHaveAttribute('aria-describedby', tooltip.id);
  });

  it('activates on click, Enter keydown, and Space keyup but not while disabled', () => {
    const onClick = jest.fn();
    const { getByTestId } = renderWithProvider(
      <RampsPaymentMethodListItem
        paymentMethod={debitCard}
        currency="USD"
        tokenSymbol="ETH"
        onClick={onClick}
      />,
      createStore(),
    );

    const row = getByTestId('ramps-payment-method-item-debit-credit-card');

    fireEvent.click(row);
    expect(onClick).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(row, { key: 'Enter' });
    expect(onClick).toHaveBeenCalledTimes(2);

    fireEvent.keyDown(row, { key: ' ' });
    expect(onClick).toHaveBeenCalledTimes(2);
    fireEvent.keyUp(row, { key: ' ' });
    expect(onClick).toHaveBeenCalledTimes(3);
  });

  it('does not activate while disabled', () => {
    const onClick = jest.fn();
    const { getByTestId } = renderWithProvider(
      <RampsPaymentMethodListItem
        paymentMethod={debitCard}
        isDisabled
        currency="USD"
        tokenSymbol="ETH"
        onClick={onClick}
      />,
      createStore(),
    );

    const row = getByTestId('ramps-payment-method-item-debit-credit-card');

    expect(row).toHaveAttribute('aria-disabled', 'true');
    expect(row).toHaveAttribute('tabindex', '-1');

    fireEvent.click(row);
    fireEvent.keyDown(row, { key: 'Enter' });
    fireEvent.keyUp(row, { key: ' ' });

    expect(onClick).not.toHaveBeenCalled();
  });
});
