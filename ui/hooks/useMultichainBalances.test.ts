import { TrxScope, TrxAccountType } from '@metamask/keyring-api';
import { KeyringTypes } from '@metamask/keyring-controller';
import type { CaipAssetType } from '@metamask/utils';
import { createBridgeMockStore } from '../../test/data/bridge/mock-bridge-store';
import { renderHookWithProvider } from '../../test/lib/render-helpers-navigate';
import { MultichainNetworks } from '../../shared/constants/multichain/networks';
import { TRON_SPECIAL_ASSET_CAIP_TYPES } from '../../shared/constants/multichain/assets';
import { KeyringType } from '../../shared/constants/keyring';
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

    expect(result.current.assetsWithBalance).toHaveLength(6);
    expect(result.current.assetsWithBalance).toMatchInlineSnapshot(`
      [
        {
          "address": "",
          "assetId": undefined,
          "balance": "1.00001",
          "chainId": "0xe708",
          "decimals": 18,
          "image": "./images/eth_logo.svg",
          "isNative": true,
          "name": "Linea",
          "secondary": 0,
          "string": "1.00001",
          "symbol": "ETH",
          "title": "Ethereum",
          "tokenFiatAmount": 2524.2752425000003,
          "type": "NATIVE",
        },
        {
          "address": "",
          "assetId": undefined,
          "balance": "1.00001",
          "chainId": "0xa",
          "decimals": 18,
          "image": "./images/eth_logo.svg",
          "isNative": true,
          "name": "OP",
          "secondary": 0,
          "string": "1.00001",
          "symbol": "ETH",
          "title": "Ethereum",
          "tokenFiatAmount": 2524.2752425000003,
          "type": "NATIVE",
        },
        {
          "accountType": undefined,
          "address": "501",
          "assetId": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501",
          "balance": "1.530",
          "chainId": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
          "decimals": 18,
          "image": "",
          "isNative": true,
          "string": "1.530",
          "symbol": "SOL",
          "tokenFiatAmount": 210.8493,
          "type": "NATIVE",
        },
        {
          "accountType": "bip122:p2wpkh",
          "address": "0",
          "assetId": "bip122:000000000019d6689c085ae165831e93/slip44:0",
          "balance": ".001",
          "chainId": "bip122:000000000019d6689c085ae165831e93",
          "decimals": 18,
          "image": "",
          "isNative": true,
          "string": ".001",
          "symbol": "BTC",
          "tokenFiatAmount": 91.238,
          "type": "NATIVE",
        },
        {
          "address": "",
          "assetId": undefined,
          "balance": "0.01",
          "chainId": "0x1",
          "decimals": 18,
          "image": "./images/eth_logo.svg",
          "isNative": true,
          "name": "Ethereum",
          "secondary": 0,
          "string": "0.01",
          "symbol": "ETH",
          "title": "Ethereum",
          "tokenFiatAmount": 25.2425,
          "type": "NATIVE",
        },
        {
          "accountType": undefined,
          "address": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          "assetId": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          "balance": "2.043238",
          "chainId": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
          "decimals": 6,
          "image": "",
          "isNative": false,
          "string": "2.043238",
          "symbol": "USDC",
          "tokenFiatAmount": 2.04284978478,
          "type": "TOKEN",
        },
      ]
    `);
  });

  it('should return a list of assets with balances', () => {
    const mockStore = createBridgeMockStore();
    const { result } = renderHookWithProvider(
      () => useMultichainBalances(),
      mockStore,
    );

    expect(result.current.assetsWithBalance).toHaveLength(9);
    expect(result.current.assetsWithBalance).toMatchInlineSnapshot(`
      [
        {
          "address": "0x514910771AF9Ca656af840dff83E8264EcF986CA",
          "assetId": undefined,
          "balance": "1",
          "chainId": "0x1",
          "isNative": false,
          "secondary": 0,
          "string": "1",
          "title": undefined,
          "tokenFiatAmount": 3029.1,
          "type": "TOKEN",
        },
        {
          "address": "",
          "assetId": undefined,
          "balance": "1.00001",
          "chainId": "0xe708",
          "decimals": 18,
          "image": "./images/eth_logo.svg",
          "isNative": true,
          "name": "Linea",
          "secondary": 0,
          "string": "1.00001",
          "symbol": "ETH",
          "title": "Ethereum",
          "tokenFiatAmount": 2524.2752425000003,
          "type": "NATIVE",
        },
        {
          "address": "",
          "assetId": undefined,
          "balance": "1.00001",
          "chainId": "0xa",
          "decimals": 18,
          "image": "./images/eth_logo.svg",
          "isNative": true,
          "name": "OP",
          "secondary": 0,
          "string": "1.00001",
          "symbol": "ETH",
          "title": "Ethereum",
          "tokenFiatAmount": 2524.2752425000003,
          "type": "NATIVE",
        },
        {
          "accountType": undefined,
          "address": "501",
          "assetId": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501",
          "balance": "1.530",
          "chainId": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
          "decimals": 18,
          "image": "",
          "isNative": true,
          "string": "1.530",
          "symbol": "SOL",
          "tokenFiatAmount": 210.8493,
          "type": "NATIVE",
        },
        {
          "accountType": "bip122:p2wpkh",
          "address": "0",
          "assetId": "bip122:000000000019d6689c085ae165831e93/slip44:0",
          "balance": ".001",
          "chainId": "bip122:000000000019d6689c085ae165831e93",
          "decimals": 18,
          "image": "",
          "isNative": true,
          "string": ".001",
          "symbol": "BTC",
          "tokenFiatAmount": 91.238,
          "type": "NATIVE",
        },
        {
          "address": "",
          "assetId": undefined,
          "balance": "0.01",
          "chainId": "0x1",
          "decimals": 18,
          "image": "./images/eth_logo.svg",
          "isNative": true,
          "name": "Ethereum",
          "secondary": 0,
          "string": "0.01",
          "symbol": "ETH",
          "title": "Ethereum",
          "tokenFiatAmount": 25.2425,
          "type": "NATIVE",
        },
        {
          "address": "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
          "assetId": undefined,
          "balance": "0.00184",
          "chainId": "0x1",
          "decimals": 6,
          "isNative": false,
          "secondary": 0,
          "string": "0.00184",
          "title": undefined,
          "tokenFiatAmount": 10.682625999999999,
          "type": "TOKEN",
        },
        {
          "accountType": undefined,
          "address": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          "assetId": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          "balance": "2.043238",
          "chainId": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
          "decimals": 6,
          "image": "",
          "isNative": false,
          "string": "2.043238",
          "symbol": "USDC",
          "tokenFiatAmount": 2.04284978478,
          "type": "TOKEN",
        },
        {
          "address": "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
          "assetId": undefined,
          "balance": "0",
          "chainId": "0xe708",
          "isNative": false,
          "secondary": 0,
          "string": "0",
          "title": undefined,
          "tokenFiatAmount": 0,
          "type": "TOKEN",
        },
      ]
    `);
  });

  it('should return a mapping of chainId to balance', () => {
    const mockStore = createBridgeMockStore();
    const { result } = renderHookWithProvider(
      () => useMultichainBalances(),
      mockStore,
    );

    expect(result.current.balanceByChainId).toMatchInlineSnapshot(`
      {
        "0x1": 3065.0251259999995,
        "0xa": 2524.2752425000003,
        "0xe708": 2524.2752425000003,
        "bip122:000000000019d6689c085ae165831e93": 91.238,
        "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp": 212.89214978478,
      }
    `);
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
          balances: {
            [MOCK_TRON_ACCOUNT.id]: {
              [tronNativeAssetId]: { amount: '100', unit: 'TRX' },
              [tronEnergyAssetId]: { amount: '500', unit: 'energy' },
              [tronBandwidthAssetId]: { amount: '300', unit: 'bandwidth' },
              [tronStakedForEnergyAssetId]: {
                amount: '50',
                unit: '195-staked-for-energy',
              },
              [tronInLockPeriodAssetId]: {
                amount: '10',
                unit: '195-in-lock-period',
              },
            },
          },
          conversionRates: {
            [tronNativeAssetId]: {
              currency: 'swift:0/iso4217:USD',
              rate: '0.25',
              conversionTime: Date.now(),
              expirationTime: Date.now() + 60000,
            },
          },
        },
      });

      // Inject Tron account into account group (createBridgeMockStore hardcodes the group)
      const groupId = 'entropy:01K2FF18CTTXJYD34R78X4N1N1/0';
      mockStore.metamask.accountTree.wallets[
        'entropy:01K2FF18CTTXJYD34R78X4N1N1'
      ].groups[groupId].accounts.push(MOCK_TRON_ACCOUNT.id);

      mockStore.metamask.accountsAssets[MOCK_TRON_ACCOUNT.id] = [
        tronNativeAssetId as CaipAssetType,
        tronEnergyAssetId as CaipAssetType,
        tronBandwidthAssetId as CaipAssetType,
        tronStakedForEnergyAssetId as CaipAssetType,
        tronInLockPeriodAssetId as CaipAssetType,
      ];

      Object.assign(mockStore.metamask.assetsMetadata, {
        [tronNativeAssetId]: {
          symbol: 'TRX',
          name: 'Tron',
          fungible: true,
          units: [{ decimals: 6, symbol: 'TRX', name: 'Tron' }],
        },
        [tronEnergyAssetId]: {
          symbol: 'energy',
          name: 'Energy',
          fungible: true,
          units: [{ decimals: 0, symbol: 'energy', name: 'Energy' }],
        },
        [tronBandwidthAssetId]: {
          symbol: 'bandwidth',
          name: 'Bandwidth',
          fungible: true,
          units: [{ decimals: 0, symbol: 'bandwidth', name: 'Bandwidth' }],
        },
        [tronStakedForEnergyAssetId]: {
          symbol: '195-staked-for-energy',
          name: 'Staked for Energy',
          fungible: true,
          units: [
            {
              decimals: 6,
              symbol: '195-staked-for-energy',
              name: 'Staked for Energy',
            },
          ],
        },
        [tronInLockPeriodAssetId]: {
          symbol: '195-in-lock-period',
          name: 'In Lock Period',
          fungible: true,
          units: [
            {
              decimals: 6,
              symbol: '195-in-lock-period',
              name: 'In Lock Period',
            },
          ],
        },
      });

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

      // Only the native TRX should contribute to the Tron chain balance.
      // Without special assets, the total should equal just the TRX fiat value.
      const tronBalance = result.current.balanceByChainId[tronChainId];
      expect(tronBalance).toBeDefined();

      // Verify special assets (energy=500, bandwidth=300, staked=50, lock=10)
      // are NOT included in the total. If they were, the total would be much higher.
      expect(tronBalance).toBeLessThan(200);
    });
  });
});
