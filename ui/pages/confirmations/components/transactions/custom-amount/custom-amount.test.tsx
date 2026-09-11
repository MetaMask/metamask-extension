import React, { useState } from 'react';
import { fireEvent, screen } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { CustomAmount, CustomAmountSkeleton } from './custom-amount';

const mockStore = configureStore([thunk]);

const getMockState = (currentCurrency = 'usd') => ({
  metamask: {
    currentCurrency,
  },
});

const CustomAmountHarness = ({ initialAmount }: { initialAmount: string }) => {
  const [amountFiat, setAmountFiat] = useState(initialAmount);
  return <CustomAmount amountFiat={amountFiat} onChange={setAmountFiat} />;
};

describe('CustomAmount', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('renders amount', () => {
    const store = mockStore(getMockState());

    renderWithProvider(<CustomAmount amountFiat="123.45" />, store);

    expect(screen.getByTestId('custom-amount-input')).toHaveValue('123.45');
  });

  it('renders fiat symbol for specified currency', () => {
    const store = mockStore(getMockState());

    renderWithProvider(
      <CustomAmount amountFiat="123.45" currency="eur" />,
      store,
    );

    expect(screen.getByText('€')).toBeInTheDocument();
  });

  it('renders selected currency symbol if currency not specified', () => {
    const store = mockStore(getMockState('usd'));

    renderWithProvider(<CustomAmount amountFiat="123.45" />, store);

    expect(screen.getByText('$')).toBeInTheDocument();
  });

  it('renders skeleton if loading', () => {
    const store = mockStore(getMockState());

    renderWithProvider(<CustomAmount amountFiat="123.45" isLoading />, store);

    expect(screen.getByTestId('custom-amount-skeleton')).toBeInTheDocument();
  });

  it('renders with error color when hasAlert is true', () => {
    const store = mockStore(getMockState());

    renderWithProvider(<CustomAmount amountFiat="123.45" hasAlert />, store);

    const amountElement = screen.getByTestId('custom-amount-input');
    expect(amountElement).toBeInTheDocument();
  });

  it('renders with muted color when disabled', () => {
    const store = mockStore(getMockState());

    renderWithProvider(<CustomAmount amountFiat="123.45" disabled />, store);

    const amountElement = screen.getByTestId('custom-amount-input');
    expect(amountElement).toBeInTheDocument();
  });

  it('uses smaller font size for longer amounts', () => {
    const store = mockStore(getMockState());

    renderWithProvider(
      <CustomAmount amountFiat="12345678901234567890" />,
      store,
    );

    const amountElement = screen.getByTestId('custom-amount-input');
    expect(amountElement).toHaveStyle({ fontSize: '20px' });
  });

  it('uses larger font size for shorter amounts', () => {
    const store = mockStore(getMockState());

    renderWithProvider(<CustomAmount amountFiat="100" />, store);

    const amountElement = screen.getByTestId('custom-amount-input');
    expect(amountElement).toHaveStyle({ fontSize: '64px' });
  });

  it('accounts for the fiat symbol when choosing font size', () => {
    const store = mockStore(getMockState());

    renderWithProvider(<CustomAmount amountFiat="12345.67" />, store);

    const amountElement = screen.getByTestId('custom-amount-input');
    expect(amountElement).toHaveStyle({ fontSize: '40px' });
  });

  it('displays at most 2 decimals for a parent-driven amount', () => {
    const store = mockStore(getMockState());

    renderWithProvider(<CustomAmount amountFiat="7.863083" />, store);

    expect(screen.getByTestId('custom-amount-input')).toHaveValue('7.86');
  });

  it('keeps sub-cent parent-driven amounts fully visible', () => {
    const store = mockStore(getMockState());

    renderWithProvider(<CustomAmount amountFiat="0.004" />, store);

    expect(screen.getByTestId('custom-amount-input')).toHaveValue('0.004');
  });

  it('restores full precision once the user edits the amount', () => {
    const store = mockStore(getMockState());

    renderWithProvider(<CustomAmountHarness initialAmount="7.863083" />, store);

    const input = screen.getByTestId('custom-amount-input');
    expect(input).toHaveValue('7.86');

    fireEvent.change(input, { target: { value: '1.2345' } });

    expect(input).toHaveValue('1.2345');
  });

  it('counts decimal separators as half a character when calculating input width', () => {
    const store = mockStore(getMockState());

    renderWithProvider(<CustomAmount amountFiat="1.33" />, store);

    const amountElement = screen.getByTestId('custom-amount-input');
    expect(amountElement).toHaveStyle({ width: '3.5ch' });
  });

  it('auto-focuses the input when autoFocus is true', () => {
    const store = mockStore(getMockState());

    renderWithProvider(<CustomAmount amountFiat="0" autoFocus />, store);

    expect(screen.getByTestId('custom-amount-input')).toHaveFocus();
  });

  it('does not focus the input when autoFocus is omitted', () => {
    const store = mockStore(getMockState());

    renderWithProvider(<CustomAmount amountFiat="0" />, store);

    expect(screen.getByTestId('custom-amount-input')).not.toHaveFocus();
  });

  it('does not focus the input when autoFocus is true but disabled', () => {
    const store = mockStore(getMockState());

    renderWithProvider(
      <CustomAmount amountFiat="0" autoFocus disabled />,
      store,
    );

    expect(screen.getByTestId('custom-amount-input')).not.toHaveFocus();
  });
});

describe('CustomAmountSkeleton', () => {
  it('renders skeleton element', () => {
    const store = mockStore(getMockState());

    renderWithProvider(<CustomAmountSkeleton />, store);

    expect(screen.getByTestId('custom-amount-skeleton')).toBeInTheDocument();
  });
});
