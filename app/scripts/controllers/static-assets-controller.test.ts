/**
 * @jest-environment node
 */
import { Hex } from '@metamask/utils';
import { AccountsControllerMessenger } from '@metamask/accounts-controller';
import {
  MOCK_ANY_NAMESPACE,
  Messenger,
  MessengerActions,
  MessengerEvents,
  MockAnyNamespace,
} from '@metamask/messenger';
import { CHAIN_IDS } from '../../../shared/constants/network';
import * as fetchWithCacheModule from '../../../shared/lib/fetch-with-cache';
import { toAssetId } from '../../../shared/lib/asset-utils';
import type { StaticAssetsControllerMessenger } from './static-assets-controller';
import { StaticAssetsController } from './static-assets-controller';

const mockTopAssets = [
  {
    assetId: 'eip155:1/erc20:0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
  },
  {
    assetId: 'eip155:1/erc20:0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
    name: 'Wrapped Bitcoin',
    symbol: 'WBTC',
    decimals: 8,
  },
];

const setupController = ({
  supportedChains,
  getIsAssetsUnifyStateEnabled = () => true,
}: {
  supportedChains: Hex[];
  getIsAssetsUnifyStateEnabled?: () => boolean;
}) => {
  const messenger = new Messenger<
    MockAnyNamespace,
    | MessengerActions<StaticAssetsControllerMessenger>
    | MessengerActions<AccountsControllerMessenger>,
    | MessengerEvents<StaticAssetsControllerMessenger>
    | MessengerEvents<AccountsControllerMessenger>
  >({ namespace: MOCK_ANY_NAMESPACE });

  const networkControllerFindNetworkClientIdByChainIdSpy = jest.fn();
  const assetsControllerGetStateSpy = jest.fn();
  const assetsControllerAddCustomAssetSpy = jest.fn();
  const fetchWithCacheSpy = jest.spyOn(fetchWithCacheModule, 'default');

  const staticAssetsControllerMessenger: StaticAssetsControllerMessenger =
    new Messenger({
      namespace: 'StaticAssetsController',
      parent: messenger,
    });

  messenger.delegate({
    messenger: staticAssetsControllerMessenger,
    actions: [
      'NetworkController:findNetworkClientIdByChainId',
      'AssetsController:getState',
      'AssetsController:addCustomAsset',
    ],
    events: [],
  });

  messenger.registerActionHandler(
    'NetworkController:findNetworkClientIdByChainId',
    networkControllerFindNetworkClientIdByChainIdSpy,
  );

  messenger.registerActionHandler(
    'AssetsController:getState',
    assetsControllerGetStateSpy,
  );

  messenger.registerActionHandler(
    'AssetsController:addCustomAsset',
    assetsControllerAddCustomAssetSpy,
  );

  const controller = new StaticAssetsController({
    messenger: staticAssetsControllerMessenger,
    getSupportedChains: () => new Set(supportedChains),
    getCacheExpirationTime: () => 1000,
    getTopX: () => 10,
    getIsAssetsUnifyStateEnabled,
  });

  return {
    controller,
    messenger,
    spies: {
      fetchWithCacheSpy,
      networkControllerFindNetworkClientIdByChainIdSpy,
      assetsControllerGetStateSpy,
      assetsControllerAddCustomAssetSpy,
    },
  };
};

describe('StaticAssetsController', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('_executePoll', () => {
    it('fetches top assets for a chain and adds them to the AssetsController', async () => {
      const {
        controller,
        spies: {
          assetsControllerGetStateSpy,
          assetsControllerAddCustomAssetSpy,
          networkControllerFindNetworkClientIdByChainIdSpy,
          fetchWithCacheSpy,
        },
      } = setupController({
        supportedChains: [CHAIN_IDS.MAINNET],
      });
      networkControllerFindNetworkClientIdByChainIdSpy.mockResolvedValue(
        'mainnet',
      );
      assetsControllerGetStateSpy.mockReturnValue({ assetPreferences: {} });
      assetsControllerAddCustomAssetSpy.mockResolvedValue(undefined);
      fetchWithCacheSpy.mockResolvedValue(mockTopAssets);

      await controller._executePoll({
        chainIds: [CHAIN_IDS.MAINNET],
        selectedAccountAddress: '0x123',
        selectedAccountId: 'mock-account-id',
      });

      const url = new URL(
        `https://token.api.cx.metamask.io/v3/tokens/trending`,
      );
      url.searchParams.set('chainIds', 'eip155:1');
      // Set the minimum volume, liquidity and market cap to 1 to fetch all tokens.
      url.searchParams.set('minVolume24hUsd', '1');
      url.searchParams.set('minLiquidity', '1');
      url.searchParams.set('minMarketCap', '1');
      expect(fetchWithCacheSpy).toHaveBeenCalledWith({
        url: url.toString(),
        fetchOptions: { method: 'GET' },
        cacheOptions: { cacheRefreshTime: expect.any(Number) },
        functionName: 'fetchTopAssets',
      });
      expect(
        networkControllerFindNetworkClientIdByChainIdSpy,
      ).toHaveBeenCalledWith(CHAIN_IDS.MAINNET);
      expect(assetsControllerGetStateSpy).toHaveBeenCalled();
      expect(assetsControllerAddCustomAssetSpy).toHaveBeenCalledTimes(
        mockTopAssets.length,
      );
      expect(assetsControllerAddCustomAssetSpy).toHaveBeenCalledWith(
        'mock-account-id',
        toAssetId(
          '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          CHAIN_IDS.MAINNET,
        ),
        expect.objectContaining({
          address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          symbol: 'WETH',
          decimals: 18,
        }),
      );
    });

    it('does not add tokens when assetsUnifyState is disabled', async () => {
      const {
        controller,
        spies: {
          assetsControllerAddCustomAssetSpy,
          networkControllerFindNetworkClientIdByChainIdSpy,
          fetchWithCacheSpy,
        },
      } = setupController({
        supportedChains: [CHAIN_IDS.MAINNET],
        getIsAssetsUnifyStateEnabled: () => false,
      });
      networkControllerFindNetworkClientIdByChainIdSpy.mockResolvedValue(
        'mainnet',
      );
      fetchWithCacheSpy.mockResolvedValue(mockTopAssets);

      await controller._executePoll({
        chainIds: [CHAIN_IDS.MAINNET],
        selectedAccountAddress: '0x123',
        selectedAccountId: 'mock-account-id',
      });

      expect(assetsControllerAddCustomAssetSpy).not.toHaveBeenCalled();
    });

    // @ts-expect-error This function is missing from the Mocha type definitions
    it.each([
      {
        payload: {
          chainIds: [CHAIN_IDS.POLYGON],
          selectedAccountAddress: '0x123',
          selectedAccountId: 'mock-account-id',
        },
        testCase: 'chain is not supported',
      },
      {
        payload: {
          chainIds: [CHAIN_IDS.MAINNET],
          selectedAccountAddress: '',
          selectedAccountId: 'mock-account-id',
        },
        testCase: 'the selected account address is not set',
      },
      {
        payload: {
          chainIds: [CHAIN_IDS.MAINNET],
          selectedAccountAddress: '0x123',
          selectedAccountId: '',
        },
        testCase: 'the selected account id is not set',
      },
      {
        payload: {
          chainIds: ['xychain'],
          selectedAccountAddress: '0x123',
          selectedAccountId: 'mock-account-id',
        },
        testCase: 'the chain is not a valid hex string',
      },
    ])(
      'does not execute the poll for a chain if $testCase',
      async ({
        payload,
      }: {
        payload: {
          chainIds: string[];
          selectedAccountAddress: string;
          selectedAccountId: string;
        };
      }) => {
        const {
          controller,
          spies: {
            assetsControllerAddCustomAssetSpy,
            networkControllerFindNetworkClientIdByChainIdSpy,
            assetsControllerGetStateSpy,
            fetchWithCacheSpy,
          },
        } = setupController({
          supportedChains: [CHAIN_IDS.MAINNET],
        });

        await controller._executePoll(payload);

        expect(fetchWithCacheSpy).not.toHaveBeenCalled();
        expect(
          networkControllerFindNetworkClientIdByChainIdSpy,
        ).not.toHaveBeenCalled();
        expect(assetsControllerGetStateSpy).not.toHaveBeenCalled();
        expect(assetsControllerAddCustomAssetSpy).not.toHaveBeenCalled();
      },
    );

    it('does not execute the poll for a chain if the network client id is not found', async () => {
      const {
        controller,
        spies: {
          assetsControllerAddCustomAssetSpy,
          networkControllerFindNetworkClientIdByChainIdSpy,
          assetsControllerGetStateSpy,
          fetchWithCacheSpy,
        },
      } = setupController({
        supportedChains: [CHAIN_IDS.MAINNET],
      });

      networkControllerFindNetworkClientIdByChainIdSpy.mockRejectedValue(
        new Error('Network client id not found'),
      );

      await controller._executePoll({
        chainIds: [CHAIN_IDS.MAINNET],
        selectedAccountAddress: '0x123',
        selectedAccountId: 'mock-account-id',
      });

      expect(fetchWithCacheSpy).not.toHaveBeenCalled();
      expect(assetsControllerGetStateSpy).not.toHaveBeenCalled();
      expect(assetsControllerAddCustomAssetSpy).not.toHaveBeenCalled();
    });

    describe('fetchTopAssets', () => {
      it('does not add tokens to the AssetsController if the fetch top assets fails', async () => {
        const {
          controller,
          spies: {
            assetsControllerAddCustomAssetSpy,
            networkControllerFindNetworkClientIdByChainIdSpy,
            fetchWithCacheSpy,
          },
        } = setupController({
          supportedChains: [CHAIN_IDS.MAINNET],
        });
        networkControllerFindNetworkClientIdByChainIdSpy.mockResolvedValue(
          'mainnet',
        );
        fetchWithCacheSpy.mockRejectedValue(
          new Error('Fetch top assets failed'),
        );

        await controller._executePoll({
          chainIds: [CHAIN_IDS.MAINNET],
          selectedAccountAddress: '0x123',
          selectedAccountId: 'mock-account-id',
        });

        expect(assetsControllerAddCustomAssetSpy).not.toHaveBeenCalled();
      });

      // @ts-expect-error This function is missing from the Mocha type definitions
      it.each([
        {
          testCase: 'it has no assetId',
          token: {
            symbol: 'ETH',
            decimals: 18,
            name: 'Ether',
          },
        },
        {
          testCase: 'it is a slip44 token',
          token: {
            assetId: 'slip44:60',
            symbol: 'SLIP44',
            decimals: null,
            name: 'SLIP44',
          },
        },
        {
          testCase: 'it is a zero address token',
          token: {
            assetId:
              'eip155:1/erc20:0x0000000000000000000000000000000000000000',
            symbol: 'ZERO',
            decimals: null,
            name: 'Zero',
          },
        },
        {
          testCase: 'it has no decimals',
          token: {
            assetId:
              'eip155:1/erc20:0x1234567890123456789012345678901234567890',
            symbol: 'NO_DECIMALS',
            decimals: null,
            name: 'No Decimals',
          },
        },
      ])(
        'ignores the token if $testCase',
        async ({
          token,
        }: {
          token: {
            assetId: string;
            symbol: string;
            decimals: number;
            name: string;
          };
        }) => {
          const {
            controller,
            spies: {
              assetsControllerGetStateSpy,
              assetsControllerAddCustomAssetSpy,
              networkControllerFindNetworkClientIdByChainIdSpy,
              fetchWithCacheSpy,
            },
          } = setupController({
            supportedChains: [CHAIN_IDS.MAINNET],
          });
          networkControllerFindNetworkClientIdByChainIdSpy.mockResolvedValue(
            'mainnet',
          );
          assetsControllerGetStateSpy.mockReturnValue({ assetPreferences: {} });
          assetsControllerAddCustomAssetSpy.mockResolvedValue(undefined);
          fetchWithCacheSpy.mockResolvedValue([...mockTopAssets, token]);

          await controller._executePoll({
            chainIds: [CHAIN_IDS.MAINNET],
            selectedAccountAddress: '0x123',
            selectedAccountId: 'mock-account-id',
          });

          expect(assetsControllerAddCustomAssetSpy).toHaveBeenCalledTimes(
            mockTopAssets.length,
          );
        },
      );
    });

    describe('filterIgnoredTokens', () => {
      it('filters out hidden tokens using AssetsController assetPreferences', async () => {
        const hiddenTokenAddress = '0xff20817765cb7f73d4bde2e66e067e58d11095c2';
        const hiddenToken = {
          assetId: `eip155:1/erc20:${hiddenTokenAddress}`,
          symbol: 'AMP',
          decimals: 18,
          name: 'Amp',
        };
        // toAssetId checksums the address, so the key must use the checksummed form.
        const hiddenTokenAssetId = toAssetId(
          hiddenTokenAddress,
          CHAIN_IDS.MAINNET,
        ) as string;
        const {
          controller,
          spies: {
            assetsControllerGetStateSpy,
            assetsControllerAddCustomAssetSpy,
            networkControllerFindNetworkClientIdByChainIdSpy,
            fetchWithCacheSpy,
          },
        } = setupController({
          supportedChains: [CHAIN_IDS.MAINNET],
        });

        networkControllerFindNetworkClientIdByChainIdSpy.mockResolvedValue(
          'mainnet',
        );
        assetsControllerGetStateSpy.mockReturnValue({
          assetPreferences: {
            [hiddenTokenAssetId]: { hidden: true },
          },
        });
        assetsControllerAddCustomAssetSpy.mockResolvedValue(undefined);
        fetchWithCacheSpy.mockResolvedValue([...mockTopAssets, hiddenToken]);

        await controller._executePoll({
          chainIds: [CHAIN_IDS.MAINNET],
          selectedAccountAddress: '0x123',
          selectedAccountId: 'mock-account-id',
        });

        expect(assetsControllerAddCustomAssetSpy).toHaveBeenCalledTimes(
          mockTopAssets.length,
        );
        const calledAssetIds = assetsControllerAddCustomAssetSpy.mock.calls.map(
          (call) => call[1],
        );
        expect(calledAssetIds).not.toContain(hiddenTokenAssetId);
      });

      it('does not add any tokens if selectedAccountId is empty', async () => {
        const {
          controller,
          spies: {
            assetsControllerAddCustomAssetSpy,
            networkControllerFindNetworkClientIdByChainIdSpy,
            fetchWithCacheSpy,
          },
        } = setupController({
          supportedChains: [CHAIN_IDS.MAINNET],
        });

        networkControllerFindNetworkClientIdByChainIdSpy.mockResolvedValue(
          'mainnet',
        );
        fetchWithCacheSpy.mockResolvedValue(mockTopAssets);

        await controller._executePoll({
          chainIds: [CHAIN_IDS.MAINNET],
          selectedAccountAddress: '0x123',
          selectedAccountId: '',
        });

        expect(assetsControllerAddCustomAssetSpy).not.toHaveBeenCalled();
      });
    });
  });
});
