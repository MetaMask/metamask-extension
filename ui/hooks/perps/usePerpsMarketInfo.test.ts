import { act } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import type { MarketInfo } from '@metamask/perps-controller';
import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import {
  MOCK_ACCOUNT_EOA,
  MOCK_ACCOUNT_PRIVATE_KEY,
} from '../../../test/data/mock-accounts';
import { UPDATE_METAMASK_STATE } from '../../store/actionConstants';
import {
  clearPerpsMarketInfoModuleCache,
  usePerpsMarketInfo,
} from './usePerpsMarketInfo';

const mockSubmitRequestToBackground = jest.fn();
jest.mock('../../store/background-connection', () => ({
  submitRequestToBackground: (...args: unknown[]) =>
    mockSubmitRequestToBackground(...args),
}));

function makeMarketInfo(overrides: Partial<MarketInfo> = {}): MarketInfo {
  return {
    name: 'BTC',
    szDecimals: 5,
    maxLeverage: 50,
    marginTableId: 0,
    ...overrides,
  } as MarketInfo;
}

const defaultPerpsMetamask = {
  isUnlocked: true,
  isTestnet: false,
  activeProvider: 'hyperliquid',
  internalAccounts: {
    selectedAccount: MOCK_ACCOUNT_EOA.id,
    accounts: {
      [MOCK_ACCOUNT_EOA.id]: MOCK_ACCOUNT_EOA,
      [MOCK_ACCOUNT_PRIVATE_KEY.id]: MOCK_ACCOUNT_PRIVATE_KEY,
    },
  },
};

describe('usePerpsMarketInfo', () => {
  beforeEach(() => {
    mockSubmitRequestToBackground.mockReset();
    clearPerpsMarketInfoModuleCache();
  });

  it('returns undefined before the fetch resolves', () => {
    mockSubmitRequestToBackground.mockReturnValue(new Promise(() => undefined));
    const { result } = renderHookWithProvider(() => usePerpsMarketInfo('BTC'), {
      metamask: defaultPerpsMetamask,
    });
    expect(result.current).toBeUndefined();
  });

  it('returns the matching market after the fetch resolves', async () => {
    const markets = [
      makeMarketInfo({ name: 'BTC' }),
      makeMarketInfo({ name: 'ETH', szDecimals: 4 }),
    ];
    mockSubmitRequestToBackground.mockResolvedValue(markets);

    const { result, waitForNextUpdate } = renderHookWithProvider(
      () => usePerpsMarketInfo('BTC'),
      { metamask: defaultPerpsMetamask },
    );

    await waitForNextUpdate();

    expect(result.current).toBeDefined();
    expect(result.current?.name).toBe('BTC');
    expect(result.current?.szDecimals).toBe(5);
  });

  it('matches symbol case-insensitively', async () => {
    const markets = [makeMarketInfo({ name: 'HYPE' })];
    mockSubmitRequestToBackground.mockResolvedValue(markets);

    const { result, waitForNextUpdate } = renderHookWithProvider(
      () => usePerpsMarketInfo('hype'),
      { metamask: defaultPerpsMetamask },
    );

    await waitForNextUpdate();

    expect(result.current?.name).toBe('HYPE');
  });

  it('returns undefined when the symbol is not in the market list', async () => {
    const markets = [makeMarketInfo({ name: 'BTC' })];
    mockSubmitRequestToBackground.mockResolvedValue(markets);

    const { result, waitForNextUpdate } = renderHookWithProvider(
      () => usePerpsMarketInfo('SOL'),
      { metamask: defaultPerpsMetamask },
    );

    await waitForNextUpdate();

    expect(result.current).toBeUndefined();
  });

  it('returns undefined and does not throw when the fetch rejects', async () => {
    mockSubmitRequestToBackground.mockRejectedValue(new Error('network error'));

    const { result } = renderHookWithProvider(() => usePerpsMarketInfo('BTC'), {
      metamask: defaultPerpsMetamask,
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current).toBeUndefined();
  });

  it('does not update state after unmount (cancelled flag)', async () => {
    let resolvePromise!: (v: MarketInfo[]) => void;
    mockSubmitRequestToBackground.mockReturnValue(
      new Promise<MarketInfo[]>((res) => {
        resolvePromise = res;
      }),
    );

    const { result, unmount } = renderHookWithProvider(
      () => usePerpsMarketInfo('BTC'),
      { metamask: defaultPerpsMetamask },
    );

    unmount();

    await act(async () => {
      resolvePromise([makeMarketInfo({ name: 'BTC' })]);
      await Promise.resolve();
    });

    expect(result.current).toBeUndefined();
  });

  it('refetches when perps environment (testnet) changes', async () => {
    const mainnetMarkets = [makeMarketInfo({ name: 'BTC', szDecimals: 5 })];
    const testnetMarkets = [makeMarketInfo({ name: 'BTC', szDecimals: 2 })];

    let call = 0;
    mockSubmitRequestToBackground.mockImplementation(async () => {
      call += 1;
      return call === 1 ? mainnetMarkets : testnetMarkets;
    });

    const { result, store } = renderHookWithProvider(
      () => usePerpsMarketInfo('BTC'),
      { metamask: defaultPerpsMetamask },
    );

    await waitFor(() => {
      expect(result.current?.szDecimals).toBe(5);
    });
    expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(1);

    await act(async () => {
      store?.dispatch({
        type: UPDATE_METAMASK_STATE,
        value: { isTestnet: true },
      });
    });

    await waitFor(() => {
      expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(2);
    });
    await waitFor(() => {
      expect(result.current?.szDecimals).toBe(2);
    });
  });

  it('uses a separate module cache per environment key', async () => {
    const mainnetMarkets = [makeMarketInfo({ name: 'BTC', szDecimals: 5 })];
    const testnetMarkets = [makeMarketInfo({ name: 'BTC', szDecimals: 1 })];

    mockSubmitRequestToBackground
      .mockResolvedValueOnce(mainnetMarkets)
      .mockResolvedValueOnce(testnetMarkets);

    const { result: mainResult } = renderHookWithProvider(
      () => usePerpsMarketInfo('BTC'),
      { metamask: { ...defaultPerpsMetamask, isTestnet: false } },
    );

    await waitFor(() => {
      expect(mainResult.current?.szDecimals).toBe(5);
    });
    expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(1);

    const { result: testResult } = renderHookWithProvider(
      () => usePerpsMarketInfo('BTC'),
      { metamask: { ...defaultPerpsMetamask, isTestnet: true } },
    );

    await waitFor(() => {
      expect(testResult.current?.szDecimals).toBe(1);
    });
    expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(2);
  });

  it('refetches when selected account address changes', async () => {
    const marketsA = [makeMarketInfo({ name: 'BTC', szDecimals: 5 })];
    const marketsB = [makeMarketInfo({ name: 'BTC', szDecimals: 3 })];

    let call = 0;
    mockSubmitRequestToBackground.mockImplementation(async () => {
      call += 1;
      return call === 1 ? marketsA : marketsB;
    });

    const { result, store } = renderHookWithProvider(
      () => usePerpsMarketInfo('BTC'),
      { metamask: defaultPerpsMetamask },
    );

    await waitFor(() => {
      expect(result.current?.szDecimals).toBe(5);
    });
    expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(1);

    await act(async () => {
      store?.dispatch({
        type: UPDATE_METAMASK_STATE,
        value: {
          internalAccounts: {
            selectedAccount: MOCK_ACCOUNT_PRIVATE_KEY.id,
            accounts: defaultPerpsMetamask.internalAccounts.accounts,
          },
        },
      });
    });

    await waitFor(() => {
      expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(2);
    });
    await waitFor(() => {
      expect(result.current?.szDecimals).toBe(3);
    });
  });

  it('refetches after clearPerpsMarketInfoModuleCache', async () => {
    const markets = [makeMarketInfo({ name: 'BTC' })];
    mockSubmitRequestToBackground.mockResolvedValue(markets);

    const { unmount, waitForNextUpdate } = renderHookWithProvider(
      () => usePerpsMarketInfo('BTC'),
      { metamask: defaultPerpsMetamask },
    );

    await waitForNextUpdate();
    expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(1);

    clearPerpsMarketInfoModuleCache();
    unmount();

    const { waitForNextUpdate: wait2 } = renderHookWithProvider(
      () => usePerpsMarketInfo('BTC'),
      { metamask: defaultPerpsMetamask },
    );

    await wait2();
    expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(2);
  });
});
