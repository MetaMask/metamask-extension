import { createBridgeMockStore } from '../../test/data/bridge/mock-bridge-store';
import { renderHookWithProvider } from '../../test/lib/render-helpers';
import { useMultichainBalances } from './useMultichainBalances';

describe('useMultichainBalances', () => {
  it('should return the native token of each imported network when no token balances are cached', () => {
    const mockStore = createBridgeMockStore({
      metamaskStateOverrides: {
        allTokens: {},
      },
    });
    const { result } = renderHookWithProvider(
      () => useMultichainBalances(),
      mockStore,
    );

    expect(result.current.assetsWithBalance).toHaveLength(2);
    expect(result.current.assetsWithBalance).toStrictEqual(
      expect.objectContaining([
        {
          address: '',
          balance: '0.000000000000000014',
          chainId: '0xe708',
          decimals: 18,
          image: './images/eth_logo.svg',
          isNative: true,
          name: 'Linea',
          primary: '',
          secondary: 0,
          string: '0.000000000000000014',
          symbol: 'ETH',
          title: 'Ethereum',
          tokenFiatAmount: 3.53395e-14,
          type: 'NATIVE',
        },
        {
          address: '',
          balance: '0.00000000000000001',
          chainId: '0x1',
          decimals: 18,
          image: './images/eth_logo.svg',
          isNative: true,
          name: 'Ethereum',
          primary: '',
          secondary: 0,
          string: '0.00000000000000001',
          symbol: 'ETH',
          title: 'Ethereum',
          tokenFiatAmount: 2.5242500000000003e-14,
          type: 'NATIVE',
        },
      ]),
    );
  });

  it('should return a list of assets with balances', () => {
    const mockStore = createBridgeMockStore();
    const { result } = renderHookWithProvider(
      () => useMultichainBalances(),
      mockStore,
    );

    expect(result.current.assetsWithBalance).toHaveLength(5);
    expect(result.current.assetsWithBalance).toStrictEqual(
      expect.objectContaining([
        {
          address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
          balance: '0.00184',
          chainId: '0x1',
          decimals: 6,
          isNative: false,
          primary: '',
          secondary: 0,
          string: '0.00184',
          title: undefined,
          tokenFiatAmount: 0.004232,
          type: 'TOKEN',
        },
        {
          address: '',
          balance: '0.000000000000000014',
          chainId: '0xe708',
          decimals: 18,
          image: './images/eth_logo.svg',
          isNative: true,
          name: 'Linea',
          primary: '',
          secondary: 0,
          string: '0.000000000000000014',
          symbol: 'ETH',
          title: 'Ethereum',
          tokenFiatAmount: 3.53395e-14,
          type: 'NATIVE',
        },
        {
          address: '',
          balance: '0.00000000000000001',
          chainId: '0x1',
          decimals: 18,
          image: './images/eth_logo.svg',
          isNative: true,
          name: 'Ethereum',
          primary: '',
          secondary: 0,
          string: '0.00000000000000001',
          symbol: 'ETH',
          title: 'Ethereum',
          tokenFiatAmount: 2.5242500000000003e-14,
          type: 'NATIVE',
        },
        {
          address: '0x514910771af9ca656af840dff83e8264ecf986ca',
          balance: '1',
          chainId: '0x1',
          isNative: false,
          primary: '',
          secondary: 0,
          string: '1',
          title: undefined,
          tokenFiatAmount: null,
          type: 'TOKEN',
        },
        {
          address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
          balance: '0',
          chainId: '0xe708',
          isNative: false,
          primary: '',
          secondary: 0,
          string: '0',
          title: undefined,
          tokenFiatAmount: null,
          type: 'TOKEN',
        },
      ]),
    );
  });

  it('should return a mapping of chainId to balance', () => {
    const mockStore = createBridgeMockStore();
    const { result } = renderHookWithProvider(
      () => useMultichainBalances(),
      mockStore,
    );

    expect(result.current.balanceByChainId).toStrictEqual({
      '0x1': 0.0042320000000252425,
      '0xe708': 3.53395e-14,
    });
  });
});
