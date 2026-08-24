import React from 'react';
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { type Asset } from '../../types/send';
import { usePayWithNoFeeToken } from './usePayWithNoFeeToken';

const ETH_USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const ETH_MUSD = '0xaca92e438df0b2401ff60da7e4337b687a2435da';

const mockStore = configureMockStore();

function renderUsePayWithNoFeeToken(
  remoteFeatureFlags: Record<string, unknown>,
) {
  const store = mockStore({
    metamask: {
      remoteFeatureFlags,
    },
  });

  return renderHook(() => usePayWithNoFeeToken(), {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    ),
  });
}

describe('usePayWithNoFeeToken', () => {
  it('returns false when the relay fixed-spread flag is empty', () => {
    const { result } = renderUsePayWithNoFeeToken({});

    expect(result.current.isNoFeeToken(ETH_USDC, '0x1')).toBe(false);
  });

  it('returns true for a subsidised source token', () => {
    const { result } = renderUsePayWithNoFeeToken({
      /* eslint-disable @typescript-eslint/naming-convention */
      confirmations_relay_fixed_spread: {
        chains: { eth: '0x1' },
        tokens: { eth_usdc: ETH_USDC, musd: ETH_MUSD },
        routes: [['eth', 'eth_usdc', 'eth', 'musd']],
      },
      /* eslint-enable @typescript-eslint/naming-convention */
    });

    expect(result.current.isNoFeeToken(ETH_USDC, '0x1')).toBe(true);
    expect(result.current.isNoFeeToken(ETH_MUSD, '0x1')).toBe(false);
  });

  it('renders a No fee tag for subsidised source tokens', () => {
    const { result } = renderUsePayWithNoFeeToken({
      /* eslint-disable @typescript-eslint/naming-convention */
      confirmations_relay_fixed_spread: {
        chains: { eth: '0x1' },
        tokens: { eth_usdc: ETH_USDC, musd: ETH_MUSD },
        routes: [['eth', 'eth_usdc', 'eth', 'musd']],
      },
      /* eslint-enable @typescript-eslint/naming-convention */
    });

    const tagged = result.current.renderNoFeeTag({
      address: ETH_USDC,
      chainId: '0x1',
      symbol: 'USDC',
    } as Asset);
    const untagged = result.current.renderNoFeeTag({
      address: ETH_MUSD,
      chainId: '0x1',
      symbol: 'MUSD',
    } as Asset);

    expect(tagged).not.toBeNull();
    expect(untagged).toBeNull();
  });
});
