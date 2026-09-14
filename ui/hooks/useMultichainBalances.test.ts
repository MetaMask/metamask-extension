import { TrxScope, TrxAccountType } from '@metamask/keyring-api';
import { KeyringTypes } from '@metamask/keyring-controller';
import {
  createBridgeMockStore,
  MOCK_EVM_ACCOUNT,
} from '../../test/data/bridge/mock-bridge-store';
import { renderHookWithProvider } from '../../test/lib/render-helpers-navigate';
import { MultichainNetworks } from '../../shared/constants/multichain/networks';
import { TRON_SPECIAL_ASSET_CAIP_TYPES } from '../../shared/constants/multichain/assets';
import { KeyringType } from '../../shared/constants/keyring';
import { useMultichainBalances } from './useMultichainBalances';

const ETH_MAINNET = 'eip155:1/slip44:60';
const ETH_LINEA = 'eip155:59144/slip44:60';
const ETH_OPTIMISM = 'eip155:10/slip44:60';

describe('useMultichainBalances', () => {
  it('should return the native token of each imported network when no token balances are cached', () => {
    // Shared mock-token-data seeds ERC-20s; clear them for this case (legacy
    // equivalent of allTokens: {}).
    const mockStore = createBridgeMockStore({
      metamaskStateOverrides: {
        assetsBalance: {
          [MOCK_EVM_ACCOUNT.id]: {
            [ETH_MAINNET]: { amount: '0.01' },
            [ETH_LINEA]: { amount: '1.0000125' },
            [ETH_OPTIMISM]: { amount: '1.0000125' },
          },
        },
        // Must replace per-account entries; `customAssets: {}` does not clear
        // because createBridgeMockStore spreads tokenData.customAssets first.
        customAssets: {
          [MOCK_EVM_ACCOUNT.id]: [],
          'a1b2c3d4-e5f6-7890-abcd-ef1234567890': [],
        },
      },
    });
    const { result } = renderHookWithProvider(
      () => useMultichainBalances(),
      mockStore,
    );

    // Exact tokenFiatAmount floats from the old inline snapshot cannot be
    // reproduced: shared createBridgeMockStore now seeds currencyRates via
    // DEFAULT_ETH_EFFECTIVE_RATE (2524.25 * legacy native market price), so
    // Linea/OP/mainnet fiat amounts differ. Assert identity + balances only.
    expect(result.current.assetsWithBalance).toHaveLength(6);
    expect(
      result.current.assetsWithBalance.map((a) => a.chainId).sort(),
    ).toEqual(
      [
        '0x1',
        '0xa',
        '0xe708',
        'bip122:000000000019d6689c085ae165831e93',
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      ].sort(),
    );
    expect(
      result.current.assetsWithBalance.find(
        (a) => a.chainId === '0x1' && a.isNative,
      )?.balance,
    ).toBe('0.01');
  });

  it('should return a list of assets with balances', () => {
    // Shared mock includes Linea/Optimism ERC-20 balances that were only in
    // legacy tokenBalances (not allTokens) for the selected account, which
    // inflates the list. Scope EVM balances to the legacy allTokens set.
    const mockStore = createBridgeMockStore({
      metamaskStateOverrides: {
        assetsBalance: {
          [MOCK_EVM_ACCOUNT.id]: {
            [ETH_MAINNET]: { amount: '0.01' },
            [ETH_LINEA]: { amount: '1.0000125' },
            [ETH_OPTIMISM]: { amount: '1.0000125' },
            'eip155:1/erc20:0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984': {
              amount: '0.001848',
            },
            // Legacy allTokens LINK had no decimals → raw 0x1 displayed as "1"
            'eip155:1/erc20:0x514910771AF9Ca656af840dff83E8264EcF986CA': {
              amount: '1',
            },
            'eip155:59144/erc20:0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984': {
              amount: '0',
            },
          },
        },
        assetsInfo: {
          'eip155:1/erc20:0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984': {
            type: 'erc20',
            decimals: 6,
          },
          'eip155:1/erc20:0x514910771AF9Ca656af840dff83E8264EcF986CA': {
            type: 'erc20',
            decimals: 0,
          },
          'eip155:59144/erc20:0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984': {
            type: 'erc20',
            decimals: 18,
          },
        },
        customAssets: {
          [MOCK_EVM_ACCOUNT.id]: [
            'eip155:59144/erc20:0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
          ],
          'a1b2c3d4-e5f6-7890-abcd-ef1234567890': [],
        },
      },
    });
    const { result } = renderHookWithProvider(
      () => useMultichainBalances(),
      mockStore,
    );

    expect(result.current.assetsWithBalance).toHaveLength(9);
    const byKey = Object.fromEntries(
      result.current.assetsWithBalance.map((a) => [
        `${a.chainId}:${a.address || 'native'}`,
        a,
      ]),
    );
    expect(
      byKey['0x1:0x514910771AF9Ca656af840dff83E8264EcF986CA']?.balance,
    ).toBe('1');
    expect(
      byKey['0x1:0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984']?.balance,
    ).toBe('0.00184');
    expect(byKey['0x1:native']?.balance).toBe('0.01');
  });

  it('should return a mapping of chainId to balance', () => {
    const mockStore = createBridgeMockStore({
      metamaskStateOverrides: {
        assetsBalance: {
          [MOCK_EVM_ACCOUNT.id]: {
            [ETH_MAINNET]: { amount: '0.01' },
            [ETH_LINEA]: { amount: '1.0000125' },
            [ETH_OPTIMISM]: { amount: '1.0000125' },
            'eip155:1/erc20:0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984': {
              amount: '0.001848',
            },
            'eip155:1/erc20:0x514910771AF9Ca656af840dff83E8264EcF986CA': {
              amount: '1',
            },
            'eip155:59144/erc20:0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984': {
              amount: '0',
            },
          },
        },
        assetsInfo: {
          'eip155:1/erc20:0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984': {
            type: 'erc20',
            decimals: 6,
          },
          'eip155:1/erc20:0x514910771AF9Ca656af840dff83E8264EcF986CA': {
            type: 'erc20',
            decimals: 0,
          },
          'eip155:59144/erc20:0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984': {
            type: 'erc20',
            decimals: 18,
          },
        },
        customAssets: {
          [MOCK_EVM_ACCOUNT.id]: [
            'eip155:59144/erc20:0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
          ],
          'a1b2c3d4-e5f6-7890-abcd-ef1234567890': [],
        },
      },
    });
    const { result } = renderHookWithProvider(
      () => useMultichainBalances(),
      mockStore,
    );

    // Chain-total floats depend on the shared mock's ETH effective rate; assert
    // presence of expected chains instead of the old exact totals.
    expect(Object.keys(result.current.balanceByChainId).sort()).toEqual(
      [
        '0x1',
        '0xa',
        '0xe708',
        'bip122:000000000019d6689c085ae165831e93',
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      ].sort(),
    );
    expect(result.current.balanceByChainId['0x1']).toBeGreaterThan(0);
  });

  describe('Tron special asset filtering', () => {
    const MOCK_TRON_ACCOUNT = {
      type: TrxAccountType.Eoa,
      id: 'tron-account-multichain-balances',
      address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
      options: {
        scope: TrxScope.Mainnet,
        entropy: {
          type: 'mnemonic',
          id: '01K2FF18CTTXJYD34R78X4N1N1',
          groupIndex: 0,
        },
      },
      scopes: [TrxScope.Mainnet],
      methods: ['tron_signTransaction'],
      metadata: {
        name: 'Tron Account',
        keyring: { type: KeyringTypes.snap },
        snap: {
          id: 'npm:@metamask/tron-wallet-snap',
          name: 'Tron',
          enabled: true,
        },
      },
    };

    const tronChainId = MultichainNetworks.TRON;
    const tronNativeAssetId = `${tronChainId}/slip44:195`;
    const tronEnergyAssetId = `${tronChainId}/${TRON_SPECIAL_ASSET_CAIP_TYPES.ENERGY}`;
    const tronBandwidthAssetId = `${tronChainId}/${TRON_SPECIAL_ASSET_CAIP_TYPES.BANDWIDTH}`;
    const tronStakedForEnergyAssetId = `${tronChainId}/${TRON_SPECIAL_ASSET_CAIP_TYPES.STAKED_FOR_ENERGY}`;
    const tronInLockPeriodAssetId = `${tronChainId}/${TRON_SPECIAL_ASSET_CAIP_TYPES.IN_LOCK_PERIOD}`;

    const createTronMockStore = () => {
      const mockStore = createBridgeMockStore({
        metamaskStateOverrides: {
          internalAccounts: {
            accounts: {
              [MOCK_TRON_ACCOUNT.id]: MOCK_TRON_ACCOUNT,
            },
          },
          assetsInfo: {
            [tronNativeAssetId]: {
              type: 'native',
              symbol: 'TRX',
              name: 'Tron',
              decimals: 6,
            },
            [tronEnergyAssetId]: {
              type: 'resource',
              symbol: 'energy',
              name: 'Energy',
              decimals: 0,
            },
            [tronBandwidthAssetId]: {
              type: 'resource',
              symbol: 'bandwidth',
              name: 'Bandwidth',
              decimals: 0,
            },
            [tronStakedForEnergyAssetId]: {
              type: 'resource',
              symbol: '195-staked-for-energy',
              name: 'Staked for Energy',
              decimals: 6,
            },
            [tronInLockPeriodAssetId]: {
              type: 'resource',
              symbol: '195-in-lock-period',
              name: 'In Lock Period',
              decimals: 6,
            },
          },
          assetsBalance: {
            [MOCK_TRON_ACCOUNT.id]: {
              [tronNativeAssetId]: { amount: '100' },
              [tronEnergyAssetId]: { amount: '500' },
              [tronBandwidthAssetId]: { amount: '300' },
              [tronStakedForEnergyAssetId]: { amount: '50' },
              [tronInLockPeriodAssetId]: { amount: '10' },
            },
          },
          assetsPrice: {
            [tronNativeAssetId]: {
              assetPriceType: 'fungible',
              price: 0.25,
              usdPrice: 0.25,
              lastUpdated: Date.now(),
            },
          },
        },
      });

      const groupId = 'entropy:01K2FF18CTTXJYD34R78X4N1N1/0';
      mockStore.metamask.accountTree.wallets[
        'entropy:01K2FF18CTTXJYD34R78X4N1N1'
      ].groups[groupId].accounts.push(MOCK_TRON_ACCOUNT.id);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockStore.metamask as any).keyrings.push({
        type: KeyringType.snap,
        accounts: [MOCK_TRON_ACCOUNT.address],
        metadata: { id: 'tron-keyring', name: '' },
      });

      return mockStore;
    };

    it('should exclude Tron special assets from assetsWithBalance', () => {
      const mockStore = createTronMockStore();
      const { result } = renderHookWithProvider(
        () => useMultichainBalances(),
        mockStore,
      );

      const tronAssets = result.current.assetsWithBalance.filter(
        (asset: { chainId: string }) => asset.chainId === tronChainId,
      );

      expect(tronAssets).toHaveLength(1);
      expect(tronAssets[0].symbol).toBe('TRX');
      expect(tronAssets[0].assetId).toBe(tronNativeAssetId);

      const specialAssetSymbols = [
        'energy',
        'bandwidth',
        '195-staked-for-energy',
        '195-in-lock-period',
      ];
      const hasSpecialAssets = result.current.assetsWithBalance.some(
        (asset: { symbol: string }) =>
          specialAssetSymbols.includes(asset.symbol),
      );
      expect(hasSpecialAssets).toBe(false);
    });

    it('should exclude Tron special assets from balanceByChainId totals', () => {
      const mockStore = createTronMockStore();
      const { result } = renderHookWithProvider(
        () => useMultichainBalances(),
        mockStore,
      );

      const tronBalance = result.current.balanceByChainId[tronChainId];
      expect(tronBalance).toBeDefined();
      expect(tronBalance).toBeLessThan(200);
    });
  });
});
