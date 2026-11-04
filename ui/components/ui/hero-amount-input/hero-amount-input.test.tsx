import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { HeroAmountInput } from './hero-amount-input';

describe('HeroAmountInput', () => {
  const boundingRect = HTMLElement.prototype.getBoundingClientRect;

  afterEach(() => {
    HTMLElement.prototype.getBoundingClientRect = boundingRect;
  });

  it('renders the prefix and the amount', () => {
    render(<HeroAmountInput prefix="$" value="100" />);

    expect(screen.getByTestId('hero-amount-prefix')).toHaveTextContent('$');
    expect(screen.getByTestId('hero-amount-field')).toHaveValue('100');
  });

  it('accepts className and data-testid', () => {
    render(
      <HeroAmountInput
        prefix="$"
        value="1"
        className="bg-default"
        data-testid="amount-row"
      />,
    );

    expect(screen.getByTestId('amount-row')).toHaveClass('bg-default');
  });

  it('ignores letters and keeps a single separator', () => {
    const accepted: string[] = [];
    render(
      <HeroAmountInput
        prefix="$"
        value=""
        onChange={(event) => accepted.push(event.target.value)}
      />,
    );
    const field = screen.getByTestId('hero-amount-field');

    fireEvent.change(field, { target: { value: '12a' } });
    fireEvent.change(field, { target: { value: '1.2.3' } });
    fireEvent.change(field, { target: { value: '12.5' } });

    expect(accepted).toStrictEqual(['12.5']);
  });

  it('uses a custom input rule when one is given', () => {
    const onChange = jest.fn();
    render(
      <HeroAmountInput
        prefix="$"
        value=""
        onChange={onChange}
        isValidInput={(next) => next === '1'}
      />,
    );

    fireEvent.change(screen.getByTestId('hero-amount-field'), {
      target: { value: '2' },
    });
    fireEvent.change(screen.getByTestId('hero-amount-field'), {
      target: { value: '1' },
    });

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('exposes the prefix, amount, and field through test ids and prop objects', () => {
    const inputRef = { current: null } as React.RefObject<HTMLInputElement>;
    const onPaste = jest.fn();

    render(
      <HeroAmountInput
        prefix="$"
        value="100"
        inputRef={inputRef}
        prefixTestId="amount-symbol"
        inputTestId="amount-field"
        amountTestId="amount-value"
        prefixProps={{ className: 'prefix-extra' }}
        inputProps={{ autoComplete: 'off', onPaste, className: 'field-extra' }}
        amountProps={{ className: 'value-extra' }}
        containerProps={{ onClick: jest.fn() }}
      />,
    );

    expect(screen.getByTestId('amount-symbol')).toHaveClass('prefix-extra');
    expect(screen.getByTestId('amount-value')).toHaveTextContent('100');
    expect(screen.getByTestId('amount-value')).toHaveClass('value-extra');
    expect(screen.getByTestId('amount-field')).toHaveClass('field-extra');
    expect(screen.getByTestId('amount-field')).toHaveAttribute(
      'autocomplete',
      'off',
    );
    expect(inputRef.current).toBe(screen.getByTestId('amount-field'));

    fireEvent.paste(screen.getByTestId('amount-field'));
    expect(onPaste).toHaveBeenCalledTimes(1);
  });

  it('uses the error color when hasError is set', () => {
    render(<HeroAmountInput prefix="$" value="1" hasError />);

    expect(screen.getByTestId('hero-amount-prefix')).toHaveClass(
      'text-error-default',
    );
  });

  it('sizes a long amount from the digit width at the popup fallback', () => {
    render(<HeroAmountInput prefix="$" value="12345678901234567890" />);

    expect(screen.getByTestId('hero-amount-field')).toHaveStyle({
      fontSize: '32px',
    });
  });

  it('uses the measured prefix width instead of a character table', () => {
    HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
      if (this.dataset.testid === 'hero-amount-prefix-probe') {
        return {
          width: 170,
          height: 100,
          top: 0,
          left: 0,
          bottom: 100,
          right: 170,
          x: 0,
          y: 0,
          toJSON() {
            return {};
          },
        };
      }
      return boundingRect.call(this);
    };

    render(<HeroAmountInput prefix="KRW" value="12345678901234567890" />);

    expect(screen.getByTestId('hero-amount-field')).toHaveStyle({
      fontSize: '24px',
    });
  });
});
