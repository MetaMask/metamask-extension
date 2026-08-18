import { useQuery } from '@metamask/react-data-query';
import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import { useMoneyVaultApy } from './use-money-vault-apy';

jest.mock('@metamask/react-data-query', () => ({
  useQuery: jest.fn(),
}));

const mockUseQuery = jest.mocked(useQuery);

function renderApyHook(
  queryResult: Partial<ReturnType<typeof useQuery>>,
  control: Record<string, unknown> = {},
  enabled = true,
) {
  mockUseQuery.mockReturnValue(queryResult as ReturnType<typeof useQuery>);
  return renderHookWithProvider(() => useMoneyVaultApy(enabled), {
    metamask: {
      remoteFeatureFlags: {
        earnMoneyVaultApyControl: control,
      },
    },
  });
}

describe('useMoneyVaultApy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('prefers the remote override to a live APY', () => {
    const { result } = renderApyHook(
      { isLoading: false, isError: false, data: { apy: 0.031 } },
      { vaultApyOverride: 0.05, vaultApyFallback: 0.02 },
    );

    expect(result.current.apyDecimal).toBe(0.05);
    expect(result.current.formattedApy).toBe('5%');
  });

  it('uses the live APY when no override exists', () => {
    const { result } = renderApyHook({
      isLoading: false,
      isError: false,
      data: { apy: 0.031 },
    });

    expect(result.current.formattedApy).toBe('3.1%');
  });

  it('formats a high-precision numeric APY without throwing', () => {
    const { result } = renderApyHook({
      isLoading: false,
      isError: false,
      data: { apy: 0.07520655510967633 },
    });

    expect(result.current.formattedApy).toBe('7.5%');
  });

  it('uses the fallback after the live query settles with an error', () => {
    const { result } = renderApyHook(
      { isLoading: false, isError: true, data: undefined },
      { vaultApyFallback: 0.025 },
    );

    expect(result.current.formattedApy).toBe('2.5%');
  });

  it('does not use the fallback while the live query is loading', () => {
    const { result } = renderApyHook(
      { isLoading: true, isError: false, data: undefined },
      { vaultApyFallback: 0.025 },
    );

    expect(result.current.formattedApy).toBeUndefined();
  });

  it('passes query enablement through to the service query', () => {
    renderApyHook(
      { isLoading: false, isError: false, data: undefined },
      {},
      false,
    );

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false }),
    );
  });
});
