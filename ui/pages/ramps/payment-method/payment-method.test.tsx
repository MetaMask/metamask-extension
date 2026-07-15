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

describe('RampsPaymentMethodScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useRampsController.mockReturnValue({
      paymentMethods: [debitCard, bankTransfer],
      paymentMethodsStatus: 'success',
      paymentMethodsError: null,
      selectedPaymentMethod: debitCard,
      selectedProvider: null,
      userRegion: {
        country: { currency: 'USD' },
      },
      setSelectedPaymentMethod: mockSetSelectedPaymentMethod,
    });
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
      paymentMethods: [],
      paymentMethodsStatus: 'loading',
      paymentMethodsError: null,
      selectedPaymentMethod: null,
      selectedProvider: null,
      userRegion: null,
      setSelectedPaymentMethod: mockSetSelectedPaymentMethod,
    });

    const { container } = renderWithProvider(
      <RampsPaymentMethodScreen />,
      createStore(),
      '/ramps/payment-method',
    );

    expect(container).toMatchSnapshot();
  });

  it('matches snapshot when payment methods fail to load', () => {
    useRampsController.mockReturnValue({
      paymentMethods: [],
      paymentMethodsStatus: 'error',
      paymentMethodsError: 'Failed to load payment methods',
      selectedPaymentMethod: null,
      selectedProvider: null,
      userRegion: null,
      setSelectedPaymentMethod: mockSetSelectedPaymentMethod,
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
      paymentMethods: [],
      paymentMethodsStatus: 'success',
      paymentMethodsError: null,
      selectedPaymentMethod: null,
      selectedProvider: null,
      userRegion: null,
      setSelectedPaymentMethod: mockSetSelectedPaymentMethod,
    });

    const { container } = renderWithProvider(
      <RampsPaymentMethodScreen />,
      createStore(),
      '/ramps/payment-method',
    );

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
});
