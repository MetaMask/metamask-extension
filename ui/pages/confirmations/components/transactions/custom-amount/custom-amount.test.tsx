import React, { useState } from 'react';
import { act, fireEvent, screen } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import {
  mockResizeObserver,
  type ResizeObserverMock,
} from '../../../../../../test/lib/mock-resize-observer';
import { CustomAmount, CustomAmountSkeleton } from './custom-amount';

const mockStore = configureStore([thunk]);

const getMockState = (selectedCurrency = 'usd') => ({
  metamask: {
    selectedCurrency,
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

  it('sets the symbol, measuring text and input in Hero at the same size', () => {
    const store = mockStore(getMockState());

    renderWithProvider(<CustomAmount amountFiat="100" />, store);

    const symbol = screen.getByTestId('custom-amount-symbol');
    const input = screen.getByTestId('custom-amount-input');
    const measuringText = input.parentElement?.querySelector(
      '[aria-hidden="true"]',
    );

    expect(measuringText).toHaveTextContent('100');
    for (const element of [symbol, measuringText, input]) {
      expect(element).toHaveClass('font-hero');
      expect(element).toHaveStyle({ fontSize: '88px', lineHeight: '88px' });
    }
  });

  it('steps down the shared amount scale for longer amounts', () => {
    const store = mockStore(getMockState());

    renderWithProvider(
      <CustomAmount amountFiat="12345678901234567890" />,
      store,
    );

    expect(screen.getByTestId('custom-amount-input')).toHaveStyle({
      fontSize: '32px',
      lineHeight: '32px',
    });
  });

  it('accounts for the fiat symbol when choosing font size', () => {
    const store = mockStore(getMockState());

    renderWithProvider(<CustomAmount amountFiat="1234567.89" />, store);

    expect(screen.getByTestId('custom-amount-input')).toHaveStyle({
      fontSize: '72px',
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
      renderWithProvider(
        <CustomAmount amountFiat="1234567.89" />,
        mockStore(getMockState()),
      );
      act(() => resizeObserver.resize(width));
      return screen.getByTestId('custom-amount-input');
    };

    it('keeps a long amount larger in a wide layout', () => {
      expect(renderAtWidth(600)).toHaveStyle({ fontSize: '88px' });
    });

    it('steps a long amount down in a narrow layout', () => {
      expect(renderAtWidth(250)).toHaveStyle({ fontSize: '48px' });
    });

    it('does not re-run the measurement while typing', () => {
      renderWithProvider(
        <CustomAmountHarness initialAmount="0" />,
        mockStore(getMockState()),
      );
      act(() => resizeObserver.resize(600));
      const input = screen.getByTestId('custom-amount-input');

      for (const value of ['1', '1234', '1234567', '1234567.89']) {
        fireEvent.change(input, { target: { value } });
      }

      expect(input).toHaveValue('1234567.89');
      expect(input).toHaveStyle({ fontSize: '88px' });
      expect(resizeObserver.constructorSpy).toHaveBeenCalledTimes(1);
      expect(resizeObserver.observe).toHaveBeenCalledTimes(1);
      expect(resizeObserver.disconnect).not.toHaveBeenCalled();
    });
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

  it('applies an edited amount', () => {
    const store = mockStore(getMockState());

    renderWithProvider(<CustomAmountHarness initialAmount="7.863083" />, store);

    const input = screen.getByTestId('custom-amount-input');
    expect(input).toHaveValue('7.86');

    fireEvent.change(input, { target: { value: '1.23' } });

    expect(input).toHaveValue('1.23');
  });

  it('ignores an edit with more than 2 decimals', () => {
    const store = mockStore(getMockState());

    renderWithProvider(<CustomAmountHarness initialAmount="0.00" />, store);

    const input = screen.getByTestId('custom-amount-input');

    fireEvent.change(input, { target: { value: '0.001' } });

    expect(input).toHaveValue('0.00');
  });

  it('ignores an edit with more than 2 decimals after a comma separator', () => {
    const store = mockStore(getMockState());
    const onChange = jest.fn();

    renderWithProvider(
      <CustomAmount amountFiat="0" onChange={onChange} />,
      store,
    );

    const input = screen.getByTestId('custom-amount-input');

    fireEvent.change(input, { target: { value: '0,001' } });
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: '0,01' } });
    expect(onChange).toHaveBeenCalledWith('0,01');
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
