import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PerpsFiatHeroAmountInput } from './perps-fiat-hero-amount-input';

describe('PerpsFiatHeroAmountInput', () => {
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

    expect(
      screen.getByTestId('perps-fiat-hero-amount-skeleton'),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('perps-fiat-hero-amount-input'),
    ).not.toBeInTheDocument();
  });
});
