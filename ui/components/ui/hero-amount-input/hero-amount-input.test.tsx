import React, { useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';

import {
  mockResizeObserver,
  type ResizeObserverMock,
} from '../../../../test/lib/mock-resize-observer';
import {
  mockElementAnimate,
  mockReducedMotion,
  type ElementAnimateMock,
} from '../animated-numeric-text/test-utils';
import { isPartialHeroAmount } from './hero-amount-input.constants';
import { HeroAmountInput } from './hero-amount-input';
import { getHeroAmountFontSize } from './hero-amount-input.utils';

const LONG_AMOUNT = '500000000000000000';
const TRANSPARENT_TEXT = '[-webkit-text-fill-color:transparent]';

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

  it('rejects a separator when no decimals are allowed', () => {
    expect(isPartialHeroAmount('1', 0)).toBe(true);
    expect(isPartialHeroAmount('', 0)).toBe(true);
    expect(isPartialHeroAmount('1.', 0)).toBe(false);
    expect(isPartialHeroAmount('1,', 0)).toBe(false);
    expect(isPartialHeroAmount('.', 0)).toBe(false);
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

  it('labels the field with the row so a row click activates the field', () => {
    render(<HeroAmountInput prefix="$" value="1" />);
    const row = screen.getByTestId('hero-amount-input');
    const field = screen.getByTestId('hero-amount-input-input');
    const onFieldClick = jest.fn();
    field.addEventListener('click', onFieldClick);

    fireEvent.click(screen.getByTestId('hero-amount-input-prefix'));

    expect(row.tagName).toBe('LABEL');
    expect(field.closest('label')).toBe(row);
    expect(onFieldClick).toHaveBeenCalledTimes(1);
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

  it('gives the prefix probe the prefix weight classes', () => {
    render(<HeroAmountInput prefix="KRW" value="1" />);

    const probe = screen.getByText('KRW', { selector: '[aria-hidden="true"]' });
    expect(probe).toHaveClass('font-hero', 'font-bold', 'md:font-medium');
  });

  describe('prefix width', () => {
    let resizeObserver: ResizeObserverMock;

    beforeEach(() => {
      resizeObserver = mockResizeObserver();
    });

    afterEach(() => {
      resizeObserver.restore();
    });

    it('remeasures the prefix when the probe resizes', () => {
      let probeWidth = 0;
      const originalRect = HTMLElement.prototype.getBoundingClientRect;
      HTMLElement.prototype.getBoundingClientRect = function (
        this: HTMLElement,
      ) {
        const isProbe = this.getAttribute('aria-hidden') === 'true';
        const width = isProbe && this.textContent === 'KRW' ? probeWidth : 0;
        return { ...originalRect.call(this), width };
      };

      try {
        render(<HeroAmountInput prefix="KRW" value="12345678901234567890" />);
        const probe = screen.getByText('KRW', {
          selector: '[aria-hidden="true"]',
        });
        // Estimated prefix: 3 * 0.43em, which picks 32px.
        expect(screen.getByTestId('hero-amount-input-input')).toHaveStyle({
          fontSize: '32px',
        });

        // The probe now measures 170px at 100px, so the prefix is 1.7em and
        // 32px no longer fits the 328px fallback row.
        probeWidth = 170;
        act(() => resizeObserver.resize(0, probe));

        expect(screen.getByTestId('hero-amount-input-input')).toHaveStyle({
          fontSize: '24px',
        });
      } finally {
        HTMLElement.prototype.getBoundingClientRect = originalRect;
      }
    });
  });

  describe('glyph motion', () => {
    let animate: ElementAnimateMock;

    beforeEach(() => {
      animate = mockElementAnimate();
    });

    afterEach(() => {
      animate.restore();
    });

    const getValue = () => screen.getByTestId('hero-amount-input-value');
    const getField = () => screen.getByTestId('hero-amount-input-input');
    const getGlyphKeys = () =>
      Array.from(
        getValue().querySelectorAll<HTMLElement>('[data-flip-key]'),
      ).map((glyph) => glyph.dataset.flipKey);

    it('draws keyed glyphs under a field with transparent text', () => {
      render(<HeroAmountInput prefix="$" value="12.5" />);

      expect(getValue()).not.toHaveClass('invisible');
      expect(getGlyphKeys()).toStrictEqual([
        'digit-0-1',
        'digit-1-2',
        'separator-46-0',
        'digit-2-5',
      ]);
      expect(getField()).toHaveValue('12.5');
      expect(getField()).toHaveClass(TRANSPARENT_TEXT);
    });

    it('shows the field placeholder while the value is empty', () => {
      render(<HeroAmountInput value="" />);

      expect(getField()).not.toHaveClass(TRANSPARENT_TEXT);
      expect(getField()).toHaveAttribute('placeholder', '0');
      expect(getGlyphKeys()).toStrictEqual([]);
    });

    it('zooms in a typed digit and keeps the earlier glyphs mounted', () => {
      render(<ControlledAmount />);
      fireEvent.change(getField(), { target: { value: '1' } });
      const first = getValue().querySelector('[data-flip-key="digit-0-1"]');
      animate.calls.length = 0;

      fireEvent.change(getField(), { target: { value: '12' } });

      expect(getValue().querySelector('[data-flip-key="digit-0-1"]')).toBe(
        first,
      );
      const zooms = animate.calls.filter(
        ({ keyframes }) => keyframes[0].transform === 'scale(0)',
      );
      expect(zooms).toHaveLength(1);
      expect(zooms[0].element).toHaveTextContent('2');
    });

    it('zooms out a deleted digit', () => {
      render(<ControlledAmount />);
      fireEvent.change(getField(), { target: { value: '12' } });
      animate.calls.length = 0;

      fireEvent.change(getField(), { target: { value: '1' } });

      const exits = animate.calls.filter(
        ({ keyframes }) => keyframes[1]?.transform === 'scale(0)',
      );
      expect(exits).toHaveLength(1);
      expect(exits[0].element).toHaveTextContent('2');
    });

    it('still rejects invalid keystrokes', () => {
      render(<ControlledAmount maxDecimals={2} />);

      for (const value of ['1', '1a', '1.2.', '1.23', '1.234']) {
        fireEvent.change(getField(), { target: { value } });
      }

      expect(getField()).toHaveValue('1.23');
      expect(getValue()).toHaveTextContent('1.23');
    });

    it('shows the field text while an IME composition is open', () => {
      render(<HeroAmountInput value="12" />);

      fireEvent.compositionStart(getField());
      expect(getValue()).toHaveClass('invisible');
      expect(getField()).not.toHaveClass(TRANSPARENT_TEXT);

      fireEvent.compositionEnd(getField());
      expect(getValue()).not.toHaveClass('invisible');
      expect(getField()).toHaveClass(TRANSPARENT_TEXT);
    });

    it('forwards composition and scroll handlers from inputProps', () => {
      const onCompositionStart = jest.fn();
      const onCompositionEnd = jest.fn();
      const onScroll = jest.fn();
      render(
        <HeroAmountInput
          value="12"
          inputProps={{ onCompositionStart, onCompositionEnd, onScroll }}
        />,
      );

      fireEvent.compositionStart(getField());
      fireEvent.compositionEnd(getField());
      fireEvent.scroll(getField());

      expect(onCompositionStart).toHaveBeenCalledTimes(1);
      expect(onCompositionEnd).toHaveBeenCalledTimes(1);
      expect(onScroll).toHaveBeenCalledTimes(1);
    });

    it('moves the glyphs with the field when it scrolls', () => {
      render(<HeroAmountInput value={LONG_AMOUNT} />);
      const field = getField();

      field.scrollLeft = 40;
      fireEvent.scroll(field);

      expect(getValue().style.transform).toBe('translateX(-40px)');
    });

    describe('with reduced motion', () => {
      let restoreReducedMotion: () => void;

      beforeEach(() => {
        restoreReducedMotion = mockReducedMotion();
      });

      afterEach(() => {
        restoreReducedMotion();
      });

      it('shows the field text without glyphs or animation', () => {
        render(<ControlledAmount />);

        fireEvent.change(getField(), { target: { value: '1' } });
        fireEvent.change(getField(), { target: { value: '12' } });
        fireEvent.change(getField(), { target: { value: '1' } });

        expect(getValue()).toHaveClass('invisible');
        expect(getField()).not.toHaveClass(TRANSPARENT_TEXT);
        expect(getGlyphKeys()).toStrictEqual([]);
        expect(animate.calls).toHaveLength(0);
      });
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
