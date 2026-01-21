import React from 'react';
import { screen } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import {
  useIsTransactionPayLoading,
  useTransactionPayIsMaxAmount,
} from '../../../hooks/pay/useTransactionPayData';
import { CustomAmount, CustomAmountSkeleton } from './custom-amount';

jest.mock('../../../hooks/pay/useTransactionPayData');

const mockUseTransactionPayIsMaxAmount = jest.mocked(
  useTransactionPayIsMaxAmount,
);
const mockUseIsTransactionPayLoading = jest.mocked(useIsTransactionPayLoading);

const mockStore = configureStore([thunk]);

const getMockState = (currentCurrency = 'usd') => ({
  metamask: {
    currentCurrency,
  },
});

describe('CustomAmount', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockUseTransactionPayIsMaxAmount.mockReturnValue(false);
    mockUseIsTransactionPayLoading.mockReturnValue(false);
  });

  it('renders amount', () => {
    const store = mockStore(getMockState());

    renderWithProvider(<CustomAmount amountFiat="123.45" />, store);

    expect(screen.getByText('123.45')).toBeInTheDocument();
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

  it('renders skeleton when max amount and quotes are loading', () => {
    mockUseTransactionPayIsMaxAmount.mockReturnValue(true);
    mockUseIsTransactionPayLoading.mockReturnValue(true);

    const store = mockStore(getMockState());

    renderWithProvider(<CustomAmount amountFiat="123.45" />, store);

    expect(screen.getByTestId('custom-amount-skeleton')).toBeInTheDocument();
  });

  it('renders amount when max amount but quotes are not loading', () => {
    mockUseTransactionPayIsMaxAmount.mockReturnValue(true);
    mockUseIsTransactionPayLoading.mockReturnValue(false);

    const store = mockStore(getMockState());

    renderWithProvider(<CustomAmount amountFiat="123.45" />, store);

    expect(screen.getByText('123.45')).toBeInTheDocument();
  });

  it('renders amount when quotes are loading but not max amount', () => {
    mockUseTransactionPayIsMaxAmount.mockReturnValue(false);
    mockUseIsTransactionPayLoading.mockReturnValue(true);

    const store = mockStore(getMockState());

    renderWithProvider(<CustomAmount amountFiat="123.45" />, store);

    expect(screen.getByText('123.45')).toBeInTheDocument();
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
});

describe('CustomAmountSkeleton', () => {
  it('renders skeleton element', () => {
    const store = mockStore(getMockState());

    renderWithProvider(<CustomAmountSkeleton />, store);

    expect(screen.getByTestId('custom-amount-skeleton')).toBeInTheDocument();
  });
});
