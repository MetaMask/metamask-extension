import type { Hex } from '@metamask/utils';
import { useQuery } from '@metamask/react-data-query';
import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import { MoneyAccountApiDataServiceQueryKeys } from '../../../shared/lib/money/query-keys';
import { useMoneyAccountInfo } from './useMoneyAccountInfo';
import { useMoneyAccountInterest } from './useMoneyAccountInterest';

jest.mock('@metamask/react-data-query', () => ({
  useQuery: jest.fn(),
}));

jest.mock('./useMoneyAccountInfo', () => ({
  useMoneyAccountInfo: jest.fn(),
}));

const mockUseQuery = jest.mocked(useQuery);
const mockUseMoneyAccountInfo = jest.mocked(useMoneyAccountInfo);

const MONEY_ADDRESS: Hex = '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B';
const VAULT_ADDRESS: Hex = '0xb4563bcD3B7764CCBf497f515585f70B6C3EA5Ae';

const buildState = (chainId = '0x8f') => ({
  metamask: {
    remoteFeatureFlags: {
      moneyAccountVaultConfig: {
        chainId,
        boringVault: VAULT_ADDRESS,
        tellerAddress: '0x2D49EA58A4C70b62c8B56DE971310d9e999c8117',
        accountantAddress: '0x7382c5b8B51B8C4f127B3123C1039581BAA5A06B',
        lensAddress: '0xA816ECd922de94c6879AD23B9A884dB257F20947',
        underlyingToken: '0xacA92E438df0B2401fF60dA7E4337B687a2435DA',
      },
    },
  },
});

describe('useMoneyAccountInterest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQuery.mockReturnValue({} as never);
    mockUseMoneyAccountInfo.mockReturnValue({
      isMoneyAccountFeatureEnabled: true,
      hasMoneyAccount: true,
      primaryMoneyAccount: { address: MONEY_ADDRESS },
    });
  });

  it('fetches the 30-day and since-inception interest windows', () => {
    renderHookWithProvider(() => useMoneyAccountInterest(), buildState());

    expect(mockUseQuery).toHaveBeenNthCalledWith(1, {
      queryKey: [
        MoneyAccountApiDataServiceQueryKeys.FETCH_INTEREST,
        MONEY_ADDRESS,
        {
          vaultAddress: VAULT_ADDRESS,
          chainId: 143,
          window: '30d',
        },
      ],
      enabled: true,
    });
    expect(mockUseQuery).toHaveBeenNthCalledWith(2, {
      queryKey: [
        MoneyAccountApiDataServiceQueryKeys.FETCH_INTEREST,
        MONEY_ADDRESS,
        {
          vaultAddress: VAULT_ADDRESS,
          chainId: 143,
          window: 'since_inception',
        },
      ],
      enabled: true,
    });
  });

  it('disables both queries when the caller disables earnings', () => {
    renderHookWithProvider(
      () => useMoneyAccountInterest({ enabled: false }),
      buildState(),
    );

    expect(mockUseQuery).toHaveBeenCalledTimes(2);
    expect(mockUseQuery.mock.calls[0][0].enabled).toBe(false);
    expect(mockUseQuery.mock.calls[1][0].enabled).toBe(false);
  });

  it('disables both queries when the Money Account address is unavailable', () => {
    mockUseMoneyAccountInfo.mockReturnValue({
      isMoneyAccountFeatureEnabled: true,
      hasMoneyAccount: false,
      primaryMoneyAccount: undefined,
    });

    renderHookWithProvider(() => useMoneyAccountInterest(), buildState());

    expect(mockUseQuery.mock.calls[0][0].enabled).toBe(false);
    expect(mockUseQuery.mock.calls[1][0].enabled).toBe(false);
  });

  it('disables both queries when the vault chain ID is unsafe', () => {
    renderHookWithProvider(
      () => useMoneyAccountInterest(),
      buildState('0x20000000000000'),
    );

    expect(mockUseQuery.mock.calls[0][0].enabled).toBe(false);
    expect(mockUseQuery.mock.calls[1][0].enabled).toBe(false);
  });

  it('disables both queries when the vault config is unavailable', () => {
    renderHookWithProvider(() => useMoneyAccountInterest(), {
      metamask: { remoteFeatureFlags: {} },
    });

    expect(mockUseQuery.mock.calls[0][0].enabled).toBe(false);
    expect(mockUseQuery.mock.calls[1][0].enabled).toBe(false);
  });
});
