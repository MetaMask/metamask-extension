import React, { useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';

import {
  mockResizeObserver,
  type ResizeObserverMock,
} from '../../../../test/lib/mock-resize-observer';
import { isPartialHeroAmount } from './hero-amount-input.constants';
import { HeroAmountInput } from './hero-amount-input';
import { getHeroAmountFontSize } from './hero-amount-input.utils';

const LONG_AMOUNT = '500000000000000000';

const ControlledAmount = (
  props: Omit<React.ComponentProps<typeof HeroAmountInput>, 'value'>,
) => {
  const [value, setValue] = useState('');
  return <HeroAmountInput {...props} value={value} onChange={setValue} />;
};

describe('isPartialHeroAmount', () => {
  it('accepts digits with one separator', () => {
    for (const value of ['', '0', '12', '12.', '.5', '12,5']) {
      expect(isPartialHeroAmount(value)).toBe(true);
    }
  });

  it('rejects letters and a second separator', () => {
    for (const value of ['12a', '1.2.3', '1,2.3', '-1', '1 000']) {
      expect(isPartialHeroAmount(value)).toBe(false);
    }
  });

  it('limits digits after the separator', () => {
    expect(isPartialHeroAmount('1.23', 2)).toBe(true);
    expect(isPartialHeroAmount('1,234', 2)).toBe(false);
  });
});

describe('getHeroAmountFontSize', () => {
  it('picks the largest step that fits', () => {
    expect(getHeroAmountFontSize(2, 328, 88)).toBe(88);
    expect(getHeroAmountFontSize(5, 328, 88)).toBe(60);
  });

  it('never starts above the max step', () => {
    expect(getHeroAmountFontSize(1, 328, 40)).toBe(40);
  });

  it('stays at the floor when nothing fits', () => {
    expect(getHeroAmountFontSize(100, 328, 88)).toBe(20);
  });
});

describe('HeroAmountInput', () => {
  const boundingRect = HTMLElement.prototype.getBoundingClientRect;

  afterEach(() => {
    HTMLElement.prototype.getBoundingClientRect = boundingRect;
  });

  it('derives child test ids from data-testid', () => {
    render(<HeroAmountInput prefix="$" value="100" data-testid="amount" />);

    expect(screen.getByTestId('amount-prefix')).toHaveTextContent('$');
    expect(screen.getByTestId('amount-value')).toHaveTextContent('100');
    expect(screen.getByTestId('amount-input')).toHaveValue('100');
  });

  it('lets prop objects extend and override child elements', () => {
    const inputRef = React.createRef<HTMLInputElement>();
    const onPaste = jest.fn();

    render(
      <HeroAmountInput
        prefix="$"
        value="100"
        inputRef={inputRef}
        prefixProps={{ className: 'prefix-extra' }}
        valueProps={{ className: 'value-extra' }}
        inputProps={{ 'data-testid': 'field', autoComplete: 'off', onPaste }}
      />,
    );

    expect(screen.getByTestId('hero-amount-input-prefix')).toHaveClass(
      'prefix-extra',
    );
    expect(screen.getByTestId('hero-amount-input-value')).toHaveClass(
      'value-extra',
    );
    expect(screen.getByTestId('field')).toHaveAttribute('autocomplete', 'off');
    expect(inputRef.current).toBe(screen.getByTestId('field'));

    fireEvent.paste(screen.getByTestId('field'));
    expect(onPaste).toHaveBeenCalledTimes(1);
  });

  it('labels the field', () => {
    render(<HeroAmountInput value="1" />);

    expect(screen.getByLabelText('[amount]')).toBe(
      screen.getByTestId('hero-amount-input-input'),
    );
  });

  it('passes accepted values and ignores letters and extra separators', () => {
    const onChange = jest.fn();
    render(<HeroAmountInput value="" onChange={onChange} />);
    const field = screen.getByTestId('hero-amount-input-input');

    fireEvent.change(field, { target: { value: '12a' } });
    fireEvent.change(field, { target: { value: '1.2.3' } });
    fireEvent.change(field, { target: { value: '12.5' } });

    expect(onChange.mock.calls).toStrictEqual([['12.5']]);
  });

  it('ignores digits past maxDecimals', () => {
    render(<ControlledAmount maxDecimals={2} />);
    const field = screen.getByTestId('hero-amount-input-input');

    fireEvent.change(field, { target: { value: '1.23' } });
    fireEvent.change(field, { target: { value: '1.234' } });

    expect(field).toHaveValue('1.23');
  });

  it('focuses the field when the row is clicked', () => {
    render(<HeroAmountInput value="1" />);

    fireEvent.click(screen.getByTestId('hero-amount-input'));

    expect(screen.getByTestId('hero-amount-input-input')).toHaveFocus();
  });

  it('uses the error color when hasError is set', () => {
    render(<HeroAmountInput prefix="$" value="1" hasError />);

    expect(screen.getByTestId('hero-amount-input-prefix')).toHaveClass(
      'text-error-default',
    );
  });

  it('mutes a disabled field but not a read-only one', () => {
    const { rerender } = render(<HeroAmountInput value="1" disabled />);
    expect(screen.getByTestId('hero-amount-input-input')).toHaveClass(
      'text-muted',
    );

    rerender(<HeroAmountInput value="1" disabled readOnly />);
    expect(screen.getByTestId('hero-amount-input-input')).toHaveClass(
      'text-default',
    );
  });

  it('renders a skeleton while loading', () => {
    render(<HeroAmountInput value="1" isLoading data-testid="amount" />);

    expect(screen.getByTestId('amount-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('amount-input')).not.toBeInTheDocument();
  });

  it('fixes the row height at the max step', () => {
    render(<HeroAmountInput value="1" maxFontSize={40} />);

    expect(screen.getByTestId('hero-amount-input')).toHaveStyle({
      height: '40px',
    });
  });

  it('sets the prefix, hidden amount, and field at the same size', () => {
    render(<HeroAmountInput prefix="$" value="100" />);

    for (const part of ['prefix', 'value', 'input']) {
      const element = screen.getByTestId(`hero-amount-input-${part}`);
      expect(element).toHaveClass('font-hero');
      expect(element).toHaveStyle({ fontSize: '88px', lineHeight: '88px' });
    }
  });

  it('sizes a long amount from the digit width at the popup fallback', () => {
    render(<HeroAmountInput prefix="$" value="12345678901234567890" />);

    expect(screen.getByTestId('hero-amount-input-input')).toHaveStyle({
      fontSize: '32px',
    });
  });

  it('measures the prefix after the loading skeleton unmounts', () => {
    HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
      const width = this.textContent === 'KRW' ? 170 : 0;
      return { ...boundingRect.call(this), width };
    };

    const { rerender } = render(
      <HeroAmountInput prefix="KRW" value="12345678901234567890" isLoading />,
    );
    rerender(<HeroAmountInput prefix="KRW" value="12345678901234567890" />);

    expect(screen.getByTestId('hero-amount-input-input')).toHaveStyle({
      fontSize: '24px',
    });
  });

  it('uses the measured prefix width', () => {
    HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
      const width = this.textContent === 'KRW' ? 170 : 0;
      return { ...boundingRect.call(this), width };
    };

    render(<HeroAmountInput prefix="KRW" value="12345678901234567890" />);

    expect(screen.getByTestId('hero-amount-input-input')).toHaveStyle({
      fontSize: '24px',
    });
  });

  describe('row width', () => {
    let resizeObserver: ResizeObserverMock;

    beforeEach(() => {
      resizeObserver = mockResizeObserver();
    });

    afterEach(() => {
      resizeObserver.restore();
    });

    const getFontSize = () =>
      screen.getByTestId('hero-amount-input-input').style.fontSize;

    it('reads the content width before the first resize notification', () => {
      const clientWidth = jest
        .spyOn(HTMLElement.prototype, 'clientWidth', 'get')
        .mockReturnValue(640);
      const computedStyle = jest
        .spyOn(window, 'getComputedStyle')
        .mockReturnValue({
          paddingLeft: '10px',
          paddingRight: '4px',
        } as CSSStyleDeclaration);

      try {
        render(<HeroAmountInput value={LONG_AMOUNT} />);

        // 640px minus 14px of padding is the 626px content box. The 328px
        // fallback would give 40px.
        expect(getFontSize()).toBe('72px');
      } finally {
        clientWidth.mockRestore();
        computedStyle.mockRestore();
      }
    });

    it('steps down when the row gets narrower', () => {
      render(<HeroAmountInput value={LONG_AMOUNT} maxFontSize={40} />);
      act(() => resizeObserver.resize(626));
      expect(getFontSize()).toBe('40px');

      act(() => resizeObserver.resize(200.4));

      expect(getFontSize()).toBe('24px');
    });

    it('falls back to the popup width when the row reports zero', () => {
      render(<HeroAmountInput value="1234567890" />);
      act(() => resizeObserver.resize(900));
      expect(getFontSize()).toBe('88px');

      act(() => resizeObserver.resize(0));

      expect(getFontSize()).toBe('72px');
    });

    it('does not re-run the measurement while typing', () => {
      render(<ControlledAmount />);
      act(() => resizeObserver.resize(626));
      const field = screen.getByTestId('hero-amount-input-input');

      for (const value of ['5', '50000', '5000000000', LONG_AMOUNT]) {
        fireEvent.change(field, { target: { value } });
      }

      expect(field).toHaveValue(LONG_AMOUNT);
      expect(resizeObserver.constructorSpy).toHaveBeenCalledTimes(1);
      expect(resizeObserver.observe).toHaveBeenCalledTimes(1);
      expect(resizeObserver.disconnect).not.toHaveBeenCalled();
    });

    it('disconnects the observer on unmount', () => {
      const { unmount } = render(<HeroAmountInput value="1" />);

      unmount();

      expect(resizeObserver.disconnect).toHaveBeenCalledTimes(1);
    });
  });
});
