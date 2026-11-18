/* eslint-disable @typescript-eslint/naming-convention -- API response fixtures use snake_case */
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { Hex } from '@metamask/utils';
import type {
  VaultRateResponse,
  VaultShareValuationsResponse,
} from '@metamask/money-account-api-data-service';
import {
  readCachedVaultShareValuations,
  writeCachedVaultShareValuations,
} from '../../../shared/lib/money/vault-share-valuation-cache';
import type { VaultShareValuationCacheEntry } from '../../../shared/lib/money/vault-share-valuations';
import { useMessenger } from '../useMessenger';
import type { AccountsApiActivity } from '../../pages/money/types/money-activity';
import { useMoneyActivityValuations } from './use-money-activity-valuations';

jest.mock('../../hooks/useMessenger', () => ({
  useMessenger: jest.fn(),
}));

jest.mock('../../../shared/lib/money/vault-share-valuation-cache', () => ({
  readCachedVaultShareValuations: jest.fn(),
  writeCachedVaultShareValuations: jest.fn(),
}));

jest.mock('../../../shared/lib/trace', () => ({
  ...jest.requireActual('../../../shared/lib/trace'),
  trace: jest.fn(
    (
      _request: unknown,
      callback: (context: { setAttribute: () => void }) => unknown,
    ) => callback({ setAttribute: jest.fn() }),
  ),
  annotateTrace: jest.fn(),
}));

const useMessengerMock = jest.mocked(useMessenger);
const readCachedMock = jest.mocked(readCachedVaultShareValuations);
const writeCachedMock = jest.mocked(writeCachedVaultShareValuations);

const MONEY_ADDRESS = '0xbF4bC559f929cE3994Ba12D71d564737357bC8C2';
const VAULT = '0xb4563bcD3B7764CCBf497f515585f70B6C3EA5Ae';
const vaultShareToken = { chainId: '0x8f' as Hex, address: VAULT as Hex };

const hash = (index: number): Hex =>
  `0x${index.toString(16).padStart(64, '0')}` as Hex;

const cardActivity = (index: number): AccountsApiActivity => ({
  kind: 'card',
  hash: hash(index),
  time: index,
  chainId: '0x8f',
  blockNumber: index,
  token: { address: VAULT as Hex, symbol: 'vmUSD', decimals: 6 },
  amount: '1000000',
  paidTo: MONEY_ADDRESS,
});

const valuationResponse = (
  indices: number[],
): VaultShareValuationsResponse => ({
  address: MONEY_ADDRESS,
  chain_id: 143,
  results: indices.map((index) => ({
    tx_hash: hash(index),
    found: true,
    valuations: [
      {
        vault_address: VAULT,
        vault_key: 'standard',
        asset_symbol: 'mUSD',
        asset_decimals: 6,
        type: 'transfer_out',
        log_index: 0,
        block_number: index,
        timestamp: '2026-06-04T11:53:51.000Z',
        shares_wei: '1000000',
        assets_wei: '1017488',
        rate: '1.017488',
        source: 'cash_flows',
      },
    ],
  })),
  as_of_block: 1,
  as_of_timestamp: '2026-06-04T11:54:00.000Z',
  data_freshness: 'live',
  indexer_lag_seconds: 0,
});

const rateResponse: VaultRateResponse = {
  vault_address: VAULT,
  chain_id: 143,
  rate: '1.5',
  timestamp: '2026-06-04T11:54:00.000Z',
  as_of_block: 1,
  as_of_timestamp: '2026-06-04T11:54:00.000Z',
  data_freshness: 'live',
  indexer_lag_seconds: 0,
};

const cachedEntry = (index: number): VaultShareValuationCacheEntry => ({
  account: MONEY_ADDRESS.toLowerCase(),
  chainId: 143,
  vaultAddress: VAULT.toLowerCase(),
  txHash: hash(index).toLowerCase(),
  valuations: [
    {
      type: 'transfer_out',
      blockNumber: index,
      sharesWei: '1000000',
      assetsWei: '2020000',
      assetDecimals: 6,
    },
  ],
});

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return function wrapperElement({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
};

describe('useMoneyActivityValuations', () => {
  const messengerCall = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useMessengerMock.mockReturnValue({
      call: messengerCall,
    } as unknown as ReturnType<typeof useMessenger>);
    readCachedMock.mockResolvedValue([]);
    writeCachedMock.mockResolvedValue();
  });

  it('sends one batch per page and writes the valuations', async () => {
    messengerCall.mockImplementation(
      (_action: string, _address: string, options: { txHashes: string[] }) =>
        Promise.resolve(
          valuationResponse(
            options.txHashes.map((txHash) => Number(BigInt(txHash))),
          ),
        ),
    );

    const { result } = renderHook(
      () =>
        useMoneyActivityValuations({
          pageActivities: [[cardActivity(1), cardActivity(2)]],
          moneyAddress: MONEY_ADDRESS,
          vaultShareTokens: [vaultShareToken],
          enabled: true,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(messengerCall).toHaveBeenCalledWith(
        'MoneyAccountApiDataService:fetchVaultShareValuations',
        MONEY_ADDRESS,
        { txHashes: [hash(1), hash(2)], chainId: 143 },
      );
    });
    await waitFor(() => {
      expect(result.current.getDisplayAmount(cardActivity(1))).toStrictEqual({
        type: 'historical',
        value: '1017488',
        decimals: 6,
      });
    });
    expect(writeCachedMock).toHaveBeenCalled();
    expect(result.current.isSettling).toBe(false);
  });

  it('skips the request when the valuation is cached', async () => {
    readCachedMock.mockResolvedValue([cachedEntry(1)]);

    const { result } = renderHook(
      () =>
        useMoneyActivityValuations({
          pageActivities: [[cardActivity(1)]],
          moneyAddress: MONEY_ADDRESS,
          vaultShareTokens: [vaultShareToken],
          enabled: true,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.getDisplayAmount(cardActivity(1))).toStrictEqual({
        type: 'historical',
        value: '2020000',
        decimals: 6,
      });
    });
    expect(messengerCall).not.toHaveBeenCalled();
  });

  it('chunks more than the maximum number of hashes', async () => {
    messengerCall.mockImplementation(
      (_action: string, _address: string, options: { txHashes: string[] }) =>
        Promise.resolve(
          valuationResponse(
            options.txHashes.map((txHash) => Number(BigInt(txHash))),
          ),
        ),
    );

    const activities = Array.from({ length: 51 }, (_, index) =>
      cardActivity(index + 1),
    );
    renderHook(
      () =>
        useMoneyActivityValuations({
          pageActivities: [activities],
          moneyAddress: MONEY_ADDRESS,
          vaultShareTokens: [vaultShareToken],
          enabled: true,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      const valuationCalls = messengerCall.mock.calls.filter(
        ([action]) =>
          action === 'MoneyAccountApiDataService:fetchVaultShareValuations',
      );
      expect(valuationCalls).toHaveLength(2);
    });
  });

  it('falls back to the current rate when no historical valuation exists', async () => {
    messengerCall.mockImplementation((action: string) =>
      Promise.resolve(
        action === 'MoneyAccountApiDataService:fetchVaultRate'
          ? rateResponse
          : {
              ...valuationResponse([]),
              results: [{ tx_hash: hash(1), found: false, valuations: [] }],
            },
      ),
    );

    const { result } = renderHook(
      () =>
        useMoneyActivityValuations({
          pageActivities: [[cardActivity(1)]],
          moneyAddress: MONEY_ADDRESS,
          vaultShareTokens: [vaultShareToken],
          enabled: true,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.getDisplayAmount(cardActivity(1))).toStrictEqual({
        type: 'approximate',
        value: '1500000',
        decimals: 6,
      });
    });
  });

  it('waits for the cache read before requesting valuations', async () => {
    let resolveCache: (entries: VaultShareValuationCacheEntry[]) => void = () =>
      undefined;
    readCachedMock.mockReturnValue(
      new Promise<VaultShareValuationCacheEntry[]>((resolve) => {
        resolveCache = resolve;
      }),
    );

    const { result } = renderHook(
      () =>
        useMoneyActivityValuations({
          pageActivities: [[cardActivity(1)]],
          moneyAddress: MONEY_ADDRESS,
          vaultShareTokens: [vaultShareToken],
          enabled: true,
        }),
      { wrapper: createWrapper() },
    );

    expect(result.current.getDisplayAmount(cardActivity(1))).toStrictEqual({
      type: 'pending',
    });
    expect(result.current.isSettling).toBe(true);
    expect(messengerCall).not.toHaveBeenCalled();

    resolveCache([cachedEntry(1)]);

    await waitFor(() => {
      expect(result.current.getDisplayAmount(cardActivity(1))).toStrictEqual({
        type: 'historical',
        value: '2020000',
        decimals: 6,
      });
    });
    expect(result.current.isSettling).toBe(false);
    expect(messengerCall).not.toHaveBeenCalled();
  });

  it('does not refetch cached valuations after a remount', async () => {
    readCachedMock.mockResolvedValue([cachedEntry(1)]);
    const wrapper = createWrapper();

    const first = renderHook(
      () =>
        useMoneyActivityValuations({
          pageActivities: [[cardActivity(1)]],
          moneyAddress: MONEY_ADDRESS,
          vaultShareTokens: [vaultShareToken],
          enabled: true,
        }),
      { wrapper },
    );

    await waitFor(() => {
      expect(
        first.result.current.getDisplayAmount(cardActivity(1)),
      ).toStrictEqual({ type: 'historical', value: '2020000', decimals: 6 });
    });
    first.unmount();

    const second = renderHook(
      () =>
        useMoneyActivityValuations({
          pageActivities: [[cardActivity(1)]],
          moneyAddress: MONEY_ADDRESS,
          vaultShareTokens: [vaultShareToken],
          enabled: true,
        }),
      { wrapper },
    );

    await waitFor(() => {
      expect(
        second.result.current.getDisplayAmount(cardActivity(1)),
      ).toStrictEqual({ type: 'historical', value: '2020000', decimals: 6 });
    });
    expect(messengerCall).not.toHaveBeenCalled();
  });

  it('keeps a vault-share row pending while the valuation request is in flight', async () => {
    let resolveValuation: (value: VaultShareValuationsResponse) => void = () =>
      undefined;
    messengerCall.mockImplementation((action: string) =>
      action === 'MoneyAccountApiDataService:fetchVaultShareValuations'
        ? new Promise<VaultShareValuationsResponse>((resolve) => {
            resolveValuation = resolve;
          })
        : Promise.resolve(rateResponse),
    );

    const { result } = renderHook(
      () =>
        useMoneyActivityValuations({
          pageActivities: [[cardActivity(1)]],
          moneyAddress: MONEY_ADDRESS,
          vaultShareTokens: [vaultShareToken],
          enabled: true,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(messengerCall).toHaveBeenCalledWith(
        'MoneyAccountApiDataService:fetchVaultShareValuations',
        MONEY_ADDRESS,
        { txHashes: [hash(1)], chainId: 143 },
      );
    });
    expect(result.current.getDisplayAmount(cardActivity(1))).toStrictEqual({
      type: 'pending',
    });
    expect(result.current.isSettling).toBe(true);

    resolveValuation(valuationResponse([1]));

    await waitFor(() => {
      expect(result.current.getDisplayAmount(cardActivity(1))).toStrictEqual({
        type: 'historical',
        value: '1017488',
        decimals: 6,
      });
    });
    expect(result.current.isSettling).toBe(false);
  });

  it('shows unavailable after the rate request fails', async () => {
    messengerCall.mockImplementation((action: string) =>
      action === 'MoneyAccountApiDataService:fetchVaultRate'
        ? Promise.reject(new Error('rate failed'))
        : Promise.resolve({
            ...valuationResponse([]),
            results: [{ tx_hash: hash(1), found: false, valuations: [] }],
          }),
    );

    const { result } = renderHook(
      () =>
        useMoneyActivityValuations({
          pageActivities: [[cardActivity(1)]],
          moneyAddress: MONEY_ADDRESS,
          vaultShareTokens: [vaultShareToken],
          enabled: true,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.getDisplayAmount(cardActivity(1))).toStrictEqual({
        type: 'unavailable',
      });
    });
    expect(result.current.isSettling).toBe(false);
  });

  it('keeps already valued rows historical when a page gains a new hash', async () => {
    let stored: VaultShareValuationCacheEntry[] = [];
    readCachedMock.mockImplementation(async () => stored);
    writeCachedMock.mockImplementation(async (entries) => {
      stored = [...entries];
    });
    messengerCall.mockImplementation(
      (action: string, _address: string, options: { txHashes: string[] }) => {
        if (action !== 'MoneyAccountApiDataService:fetchVaultShareValuations') {
          return Promise.resolve(rateResponse);
        }
        if (options.txHashes.includes(hash(2))) {
          return new Promise(() => undefined);
        }
        return Promise.resolve(valuationResponse([1]));
      },
    );

    const { result, rerender } = renderHook(
      ({ activities }: { activities: AccountsApiActivity[] }) =>
        useMoneyActivityValuations({
          pageActivities: [activities],
          moneyAddress: MONEY_ADDRESS,
          vaultShareTokens: [vaultShareToken],
          enabled: true,
        }),
      {
        initialProps: { activities: [cardActivity(1)] },
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => {
      expect(result.current.getDisplayAmount(cardActivity(1))).toStrictEqual({
        type: 'historical',
        value: '1017488',
        decimals: 6,
      });
    });

    rerender({ activities: [cardActivity(1), cardActivity(2)] });

    await waitFor(() => {
      expect(messengerCall).toHaveBeenCalledWith(
        'MoneyAccountApiDataService:fetchVaultShareValuations',
        MONEY_ADDRESS,
        { txHashes: [hash(2)], chainId: 143 },
      );
    });
    expect(result.current.getDisplayAmount(cardActivity(1))).toStrictEqual({
      type: 'historical',
      value: '1017488',
      decimals: 6,
    });
    expect(result.current.getDisplayAmount(cardActivity(2))).toStrictEqual({
      type: 'pending',
    });
  });

  it('does nothing when disabled', async () => {
    const { result } = renderHook(
      () =>
        useMoneyActivityValuations({
          pageActivities: [[cardActivity(1)]],
          moneyAddress: MONEY_ADDRESS,
          vaultShareTokens: [vaultShareToken],
          enabled: false,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSettling).toBe(false));
    expect(result.current.getDisplayAmount(cardActivity(1))).toBeUndefined();
    expect(readCachedMock).not.toHaveBeenCalled();
    expect(messengerCall).not.toHaveBeenCalled();
  });
});
