import React from 'react';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import configureStore from '../../store/store';
import { submitRequestToBackground } from '../../store/background-connection';
import mockState from '../../../test/data/mock-state.json';
import PerpsLayout from './perps-layout';

jest.mock('@metamask/perps-controller', () => ({
  PROVIDER_CONFIG: { DefaultProvider: 'hyperliquid' },
  PERPS_ERROR_CODES: {
    CLIENT_NOT_INITIALIZED: 'CLIENT_NOT_INITIALIZED',
    CLIENT_REINITIALIZING: 'CLIENT_REINITIALIZING',
    PROVIDER_NOT_AVAILABLE: 'PROVIDER_NOT_AVAILABLE',
    TOKEN_NOT_SUPPORTED: 'TOKEN_NOT_SUPPORTED',
    BRIDGE_CONTRACT_NOT_FOUND: 'BRIDGE_CONTRACT_NOT_FOUND',
    WITHDRAW_FAILED: 'WITHDRAW_FAILED',
    POSITIONS_FAILED: 'POSITIONS_FAILED',
    ACCOUNT_STATE_FAILED: 'ACCOUNT_STATE_FAILED',
    MARKETS_FAILED: 'MARKETS_FAILED',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
    ORDER_LEVERAGE_REDUCTION_FAILED: 'ORDER_LEVERAGE_REDUCTION_FAILED',
    IOC_CANCEL: 'IOC_CANCEL',
    CONNECTION_TIMEOUT: 'CONNECTION_TIMEOUT',
    WITHDRAW_ASSET_ID_REQUIRED: 'WITHDRAW_ASSET_ID_REQUIRED',
    WITHDRAW_AMOUNT_REQUIRED: 'WITHDRAW_AMOUNT_REQUIRED',
    WITHDRAW_AMOUNT_POSITIVE: 'WITHDRAW_AMOUNT_POSITIVE',
    WITHDRAW_INVALID_DESTINATION: 'WITHDRAW_INVALID_DESTINATION',
    WITHDRAW_ASSET_NOT_SUPPORTED: 'WITHDRAW_ASSET_NOT_SUPPORTED',
    WITHDRAW_INSUFFICIENT_BALANCE: 'WITHDRAW_INSUFFICIENT_BALANCE',
    DEPOSIT_ASSET_ID_REQUIRED: 'DEPOSIT_ASSET_ID_REQUIRED',
    DEPOSIT_AMOUNT_REQUIRED: 'DEPOSIT_AMOUNT_REQUIRED',
    DEPOSIT_AMOUNT_POSITIVE: 'DEPOSIT_AMOUNT_POSITIVE',
    DEPOSIT_MINIMUM_AMOUNT: 'DEPOSIT_MINIMUM_AMOUNT',
    ORDER_COIN_REQUIRED: 'ORDER_COIN_REQUIRED',
    ORDER_LIMIT_PRICE_REQUIRED: 'ORDER_LIMIT_PRICE_REQUIRED',
    ORDER_PRICE_POSITIVE: 'ORDER_PRICE_POSITIVE',
    ORDER_UNKNOWN_COIN: 'ORDER_UNKNOWN_COIN',
    ORDER_SIZE_POSITIVE: 'ORDER_SIZE_POSITIVE',
    ORDER_PRICE_REQUIRED: 'ORDER_PRICE_REQUIRED',
    ORDER_SIZE_MIN: 'ORDER_SIZE_MIN',
    ORDER_LEVERAGE_INVALID: 'ORDER_LEVERAGE_INVALID',
    ORDER_LEVERAGE_BELOW_POSITION: 'ORDER_LEVERAGE_BELOW_POSITION',
    ORDER_MAX_VALUE_EXCEEDED: 'ORDER_MAX_VALUE_EXCEEDED',
    EXCHANGE_CLIENT_NOT_AVAILABLE: 'EXCHANGE_CLIENT_NOT_AVAILABLE',
    INFO_CLIENT_NOT_AVAILABLE: 'INFO_CLIENT_NOT_AVAILABLE',
    SUBSCRIPTION_CLIENT_NOT_AVAILABLE: 'SUBSCRIPTION_CLIENT_NOT_AVAILABLE',
    NO_ACCOUNT_SELECTED: 'NO_ACCOUNT_SELECTED',
    KEYRING_LOCKED: 'KEYRING_LOCKED',
    INVALID_ADDRESS_FORMAT: 'INVALID_ADDRESS_FORMAT',
    TRANSFER_FAILED: 'TRANSFER_FAILED',
    SWAP_FAILED: 'SWAP_FAILED',
    SPOT_PAIR_NOT_FOUND: 'SPOT_PAIR_NOT_FOUND',
    PRICE_UNAVAILABLE: 'PRICE_UNAVAILABLE',
    BATCH_CANCEL_FAILED: 'BATCH_CANCEL_FAILED',
    BATCH_CLOSE_FAILED: 'BATCH_CLOSE_FAILED',
    INSUFFICIENT_MARGIN: 'INSUFFICIENT_MARGIN',
    INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
    REDUCE_ONLY_VIOLATION: 'REDUCE_ONLY_VIOLATION',
    POSITION_WOULD_FLIP: 'POSITION_WOULD_FLIP',
    MARGIN_ADJUSTMENT_FAILED: 'MARGIN_ADJUSTMENT_FAILED',
    TPSL_UPDATE_FAILED: 'TPSL_UPDATE_FAILED',
    ORDER_REJECTED: 'ORDER_REJECTED',
    SLIPPAGE_EXCEEDED: 'SLIPPAGE_EXCEEDED',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
    NETWORK_ERROR: 'NETWORK_ERROR',
  },
}));

jest.mock('../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn().mockResolvedValue(undefined),
}));

describe('PerpsLayout', () => {
  const mockSubmitRequestToBackground = jest.mocked(submitRequestToBackground);
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('signals perpsViewActive on mount and unmount', () => {
    const { unmount } = renderWithProvider(<PerpsLayout />, store);

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'perpsViewActive',
      [true],
    );

    unmount();

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'perpsViewActive',
      [false],
    );
  });

  it('persists the active perps path on mount and clears it on unmount', () => {
    const { unmount } = renderWithProvider(
      <PerpsLayout />,
      store,
      '/perps/market/BTC',
    );

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'setLastVisitedRoute',
      ['perps', '/perps/market/BTC'],
    );

    unmount();

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'setLastVisitedRoute',
      ['perps', null],
    );
  });

  it('includes the search query when persisting the path', () => {
    renderWithProvider(
      <PerpsLayout />,
      store,
      '/perps/market/BTC?source=toast',
    );

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'setLastVisitedRoute',
      ['perps', '/perps/market/BTC?source=toast'],
    );
  });

  it('does not fail when the background rejects setLastVisitedRoute', () => {
    mockSubmitRequestToBackground.mockImplementation((method: string) => {
      if (method === 'setLastVisitedRoute') {
        return Promise.reject(new Error('boom'));
      }
      return Promise.resolve(undefined);
    });

    expect(() => {
      const { unmount } = renderWithProvider(
        <PerpsLayout />,
        store,
        '/perps/market/BTC',
      );
      unmount();
    }).not.toThrow();
  });
});
