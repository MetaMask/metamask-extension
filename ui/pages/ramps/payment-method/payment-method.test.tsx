/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, fireEvent, screen } from '@testing-library/react';
import type { PaymentMethod } from '@metamask/ramps-controller';
import configureStore from '../../../store/store';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { RampsPaymentMethodScreen } from './payment-method';

const mockNavigate = jest.fn();
const mockSetSelectedPaymentMethod = jest.fn().mockResolvedValue(undefined);

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../../hooks/ramps/useRampsController', () => ({
  useRampsController: jest.fn(),
}));

const { useRampsController } = jest.requireMock(
  '../../../hooks/ramps/useRampsController',
);

const createStore = () =>
  configureStore({
    metamask: {
      selectedNetworkClientId: 'mainnet',
      currentCurrency: 'usd',
      networkConfigurationsByChainId: {
        '0x1': { chainId: '0x1', name: 'Ethereum Mainnet' },
      },
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

const defaultControllerState = {
  paymentMethods: [debitCard, bankTransfer],
  paymentMethodsLoading: false,
  paymentMethodsStatus: 'success',
  paymentMethodsError: null,
  selectedPaymentMethod: debitCard,
  selectedProvider: null,
  userRegion: {
    country: { currency: 'USD' },
  },
  setSelectedPaymentMethod: mockSetSelectedPaymentMethod,
};

describe('RampsPaymentMethodScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSetSelectedPaymentMethod.mockResolvedValue(undefined);
    useRampsController.mockReturnValue(defaultControllerState);
  });

  it('matches snapshot with payment methods', () => {
    const { container } = renderWithProvider(
      <RampsPaymentMethodScreen />,
      createStore(),
      '/ramps/payment-method',
    );

    expect(container).toMatchSnapshot();
  });

  it('matches snapshot while loading', () => {
    useRampsController.mockReturnValue({
      ...defaultControllerState,
      paymentMethods: [],
      paymentMethodsLoading: true,
      paymentMethodsStatus: 'loading',
      selectedPaymentMethod: null,
      userRegion: null,
    });

    const { container } = renderWithProvider(
      <RampsPaymentMethodScreen />,
      createStore(),
      '/ramps/payment-method',
    );

    expect(container).toMatchSnapshot();
  });

  it('matches snapshot when payment methods query is idle', () => {
    useRampsController.mockReturnValue({
      ...defaultControllerState,
      paymentMethods: [],
      paymentMethodsLoading: false,
      paymentMethodsStatus: 'idle',
      selectedPaymentMethod: null,
      userRegion: null,
    });

    const { container } = renderWithProvider(
      <RampsPaymentMethodScreen />,
      createStore(),
      '/ramps/payment-method',
    );

    expect(container).toMatchSnapshot();
  });

  it('keeps back navigation available while loading', () => {
    useRampsController.mockReturnValue({
      ...defaultControllerState,
      paymentMethods: [],
      paymentMethodsLoading: true,
      paymentMethodsStatus: 'loading',
      selectedPaymentMethod: null,
      userRegion: null,
    });

    renderWithProvider(
      <RampsPaymentMethodScreen />,
      createStore(),
      '/ramps/payment-method',
    );

    fireEvent.click(screen.getByTestId('ramps-payment-method-back'));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('keeps back navigation available when idle', () => {
    useRampsController.mockReturnValue({
      ...defaultControllerState,
      paymentMethods: [],
      paymentMethodsLoading: false,
      paymentMethodsStatus: 'idle',
      selectedPaymentMethod: null,
      userRegion: null,
    });

    renderWithProvider(
      <RampsPaymentMethodScreen />,
      createStore(),
      '/ramps/payment-method',
    );

    fireEvent.click(screen.getByTestId('ramps-payment-method-back'));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('matches snapshot when payment methods fail to load', () => {
    useRampsController.mockReturnValue({
      ...defaultControllerState,
      paymentMethods: [],
      paymentMethodsStatus: 'error',
      paymentMethodsError: 'Failed to load payment methods',
      selectedPaymentMethod: null,
      userRegion: null,
    });

    const { container } = renderWithProvider(
      <RampsPaymentMethodScreen />,
      createStore(),
      '/ramps/payment-method',
    );

    expect(container).toMatchSnapshot();
  });

  it('matches snapshot when no payment methods are available', () => {
    useRampsController.mockReturnValue({
      ...defaultControllerState,
      paymentMethods: [],
      selectedPaymentMethod: null,
      userRegion: null,
    });

    const { container } = renderWithProvider(
      <RampsPaymentMethodScreen />,
      createStore(),
      '/ramps/payment-method',
    );

    expect(container).toMatchSnapshot();
  });

  it('keeps cached methods visible when a refetch errors', () => {
    useRampsController.mockReturnValue({
      ...defaultControllerState,
      paymentMethodsStatus: 'error',
      paymentMethodsError: 'Failed to load payment methods',
    });

    const { container } = renderWithProvider(
      <RampsPaymentMethodScreen />,
      createStore(),
      '/ramps/payment-method',
    );

    expect(
      screen.getByTestId('ramps-payment-method-screen'),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('ramps-payment-method-error'),
    ).not.toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it('selects a payment method and navigates back', async () => {
    renderWithProvider(
      <RampsPaymentMethodScreen />,
      createStore(),
      '/ramps/payment-method',
    );

    await act(async () => {
      fireEvent.click(
        screen.getByTestId('ramps-payment-method-item-bank-transfer'),
      );
    });

    expect(mockSetSelectedPaymentMethod).toHaveBeenCalledWith(bankTransfer);
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('ignores a second tap while selection is in flight', async () => {
    let resolveSelect: (() => void) | undefined;
    mockSetSelectedPaymentMethod.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveSelect = resolve;
        }),
    );

    renderWithProvider(
      <RampsPaymentMethodScreen />,
      createStore(),
      '/ramps/payment-method',
    );

    fireEvent.click(
      screen.getByTestId('ramps-payment-method-item-bank-transfer'),
    );
    fireEvent.click(
      screen.getByTestId('ramps-payment-method-item-debit-credit-card'),
    );

    expect(mockSetSelectedPaymentMethod).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveSelect?.();
    });

    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });

  it('does not navigate back when selection fails', async () => {
    mockSetSelectedPaymentMethod.mockRejectedValue(new Error('failed'));

    renderWithProvider(
      <RampsPaymentMethodScreen />,
      createStore(),
      '/ramps/payment-method',
    );

    await act(async () => {
      fireEvent.click(
        screen.getByTestId('ramps-payment-method-item-bank-transfer'),
      );
    });

    expect(mockSetSelectedPaymentMethod).toHaveBeenCalledWith(bankTransfer);
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
