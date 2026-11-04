import React from 'react';
import { act, render, screen, fireEvent } from '@testing-library/react';
import {
  mockResizeObserver,
  type ResizeObserverMock,
} from '../../../../../test/lib/mock-resize-observer';
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

  it('sets the symbol, measuring text and input in Hero at the same size', () => {
    render(<PerpsFiatHeroAmountInput value="1234.5" onChange={jest.fn()} />);

    const symbol = screen.getByTestId('perps-fiat-hero-amount-symbol');
    const input = screen.getByTestId('perps-fiat-hero-amount-input');
    const measuringText = screen.getByTestId('perps-fiat-hero-amount-value');

    for (const element of [symbol, input, measuringText]) {
      expect(element).toHaveClass('font-hero');
      expect(element).toHaveStyle({ fontSize: '88px', lineHeight: '88px' });
    }
  });

  it('steps down the shared amount scale for longer amounts', () => {
    render(
      <PerpsFiatHeroAmountInput value="1234567.89" onChange={jest.fn()} />,
    );

    expect(screen.getByTestId('perps-fiat-hero-amount-input')).toHaveStyle({
      fontSize: '60px',
      lineHeight: '60px',
    });
  });

  describe('measured width', () => {
    let resizeObserver: ResizeObserverMock;

    beforeEach(() => {
      resizeObserver = mockResizeObserver();
    });

    afterEach(() => {
      resizeObserver.restore();
    });

    const renderAtWidth = (width: number) => {
      render(
        <PerpsFiatHeroAmountInput value="1234567.89" onChange={jest.fn()} />,
      );
      act(() => resizeObserver.resize(width));
      return screen.getByTestId('perps-fiat-hero-amount-input');
    };

    it('keeps a long amount larger in a wide layout', () => {
      expect(renderAtWidth(600)).toHaveStyle({ fontSize: '88px' });
    });

    it('steps a long amount down in a narrow layout', () => {
      expect(renderAtWidth(250)).toHaveStyle({ fontSize: '48px' });
    });

    it('does not re-run the measurement while typing', () => {
      const onChange = jest.fn();
      const { rerender } = render(
        <PerpsFiatHeroAmountInput value="" onChange={onChange} />,
      );
      act(() => resizeObserver.resize(600));

      for (const value of ['1', '1234', '1234567', '1234567.89']) {
        rerender(
          <PerpsFiatHeroAmountInput value={value} onChange={onChange} />,
        );
      }

      expect(screen.getByTestId('perps-fiat-hero-amount-input')).toHaveStyle({
        fontSize: '88px',
      });
      expect(resizeObserver.constructorSpy).toHaveBeenCalledTimes(1);
      expect(resizeObserver.observe).toHaveBeenCalledTimes(1);
      expect(resizeObserver.disconnect).not.toHaveBeenCalled();
    });
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

  it('auto-focuses the input when autoFocus is true', () => {
    render(
      <PerpsFiatHeroAmountInput value="0" onChange={jest.fn()} autoFocus />,
    );

    expect(screen.getByTestId('perps-fiat-hero-amount-input')).toHaveFocus();
  });

  it('does not focus when autoFocus is omitted', () => {
    render(<PerpsFiatHeroAmountInput value="0" onChange={jest.fn()} />);

    expect(
      screen.getByTestId('perps-fiat-hero-amount-input'),
    ).not.toHaveFocus();
  });

  it('does not focus when autoFocus is true but disabled', () => {
    render(
      <PerpsFiatHeroAmountInput
        value="0"
        onChange={jest.fn()}
        autoFocus
        disabled
      />,
    );

    expect(
      screen.getByTestId('perps-fiat-hero-amount-input'),
    ).not.toHaveFocus();
  });
});
