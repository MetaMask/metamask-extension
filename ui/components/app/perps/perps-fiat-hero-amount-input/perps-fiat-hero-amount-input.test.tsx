import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  PerpsFiatHeroAmountInput,
  isValidPartialFiatAmountInput,
} from './perps-fiat-hero-amount-input';

describe('isValidPartialFiatAmountInput', () => {
  it('accepts empty, digits, and a single separator', () => {
    expect(isValidPartialFiatAmountInput('')).toBe(true);
    expect(isValidPartialFiatAmountInput('0')).toBe(true);
    expect(isValidPartialFiatAmountInput('12.5')).toBe(true);
    expect(isValidPartialFiatAmountInput('12,5')).toBe(true);
    expect(isValidPartialFiatAmountInput('.5')).toBe(true);
    expect(isValidPartialFiatAmountInput('5.')).toBe(true);
  });

  it('rejects invalid characters and multiple separators', () => {
    expect(isValidPartialFiatAmountInput('12a')).toBe(false);
    expect(isValidPartialFiatAmountInput('1.2.3')).toBe(false);
    expect(isValidPartialFiatAmountInput('1,2,')).toBe(false);
  });

  it('rejects input longer than the max length', () => {
    expect(isValidPartialFiatAmountInput('0'.repeat(49))).toBe(false);
    expect(isValidPartialFiatAmountInput('0'.repeat(48))).toBe(true);
  });
});

describe('PerpsFiatHeroAmountInput', () => {
  it('renders symbol and input for the given value', () => {
    render(<PerpsFiatHeroAmountInput value="2.707414" onChange={jest.fn()} />);
    expect(
      screen.getByTestId('perps-fiat-hero-amount-symbol'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('perps-fiat-hero-amount-input')).toHaveValue(
      '2.707414',
    );
  });

  it('renders symbol and forwards input changes', () => {
    const onChange = jest.fn();
    render(<PerpsFiatHeroAmountInput value="" onChange={onChange} />);

    expect(
      screen.getByTestId('perps-fiat-hero-amount-symbol'),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByTestId('perps-fiat-hero-amount-input'), {
      target: { value: '12.5' },
    });
    expect(onChange).toHaveBeenCalledWith('12.5');
  });

  it('shows skeleton when loading', () => {
    render(
      <PerpsFiatHeroAmountInput value="1" onChange={jest.fn()} isLoading />,
    );

    const skeleton = screen.getByTestId('perps-fiat-hero-amount-skeleton');
    expect(skeleton).toBeInTheDocument();
    expect(
      screen.queryByTestId('perps-fiat-hero-amount-input'),
    ).not.toBeInTheDocument();
  });
});
