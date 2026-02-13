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

const setupController = ({ supportedChains }: { supportedChains: Hex[] }) => {
  const messenger = new Messenger<
    MockAnyNamespace,
    | MessengerActions<StaticAssetsControllerMessenger>
    | MessengerActions<AccountsControllerMessenger>,
    | MessengerEvents<StaticAssetsControllerMessenger>
    | MessengerEvents<AccountsControllerMessenger>
  >({ namespace: MOCK_ANY_NAMESPACE });

  const tokensControllerAddTokensSpy = jest.fn();
  const networkControllerFindNetworkClientIdByChainIdSpy = jest.fn();
  const tokensControllerGetStateSpy = jest.fn();
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
      'TokensController:getState',
      'TokensController:addTokens',
    ],
    events: [],
  });

  messenger.registerActionHandler(
    'NetworkController:findNetworkClientIdByChainId',
    networkControllerFindNetworkClientIdByChainIdSpy,
  );

  messenger.registerActionHandler(
    'TokensController:getState',
    tokensControllerGetStateSpy,
  );

  messenger.registerActionHandler(
    'TokensController:addTokens',
    tokensControllerAddTokensSpy,
  );

  const controller = new StaticAssetsController({
    messenger: staticAssetsControllerMessenger,
    getSupportedChains: () => new Set(supportedChains),
    getCacheExpirationTime: () => 1000,
    getTopX: () => 10,
  });

  return {
    controller,
    messenger,
    spies: {
      fetchWithCacheSpy,
      tokensControllerAddTokensSpy,
      networkControllerFindNetworkClientIdByChainIdSpy,
      tokensControllerGetStateSpy,
    },
  };
};

describe('StaticAssetsController', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('_executePoll', () => {
    it('fetches top assets for a chain and add them to the TokensController', async () => {
      const {
        controller,
        spies: {
          tokensControllerAddTokensSpy,
          networkControllerFindNetworkClientIdByChainIdSpy,
          tokensControllerGetStateSpy,
          fetchWithCacheSpy,
        },
      } = setupController({
        supportedChains: [CHAIN_IDS.MAINNET],
      });
      networkControllerFindNetworkClientIdByChainIdSpy.mockResolvedValue(
        'mainnet',
      );
      tokensControllerGetStateSpy.mockResolvedValue({
        allIgnoredTokens: {},
      });
      tokensControllerAddTokensSpy.mockReturnThis();
      fetchWithCacheSpy.mockResolvedValue(mockTopAssets);

      await controller._executePoll({
        chainIds: [CHAIN_IDS.MAINNET],
        selectedAccountAddress: '0x123',
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
      expect(tokensControllerGetStateSpy).toHaveBeenCalled();
      expect(tokensControllerAddTokensSpy).toHaveBeenCalledWith(
        [
          {
            address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            symbol: 'WETH',
            decimals: 18,
            name: 'Wrapped Ether',
            aggregators: [],
            image:
              'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/erc20/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2.png',
          },
          {
            address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
            symbol: 'WBTC',
            decimals: 8,
            name: 'Wrapped Bitcoin',
            aggregators: [],
            image:
              'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/erc20/0x2260fac5e5542a773aa44fbcfedf7c193bc2c599.png',
          },
        ],
        'mainnet',
      );
    });

    // @ts-expect-error This function is missing from the Mocha type definitions
    it.each([
      {
        payload: {
          chainIds: [CHAIN_IDS.POLYGON],
          selectedAccountAddress: '0x123',
        },
        testCase: 'chain is not supported',
      },
      {
        payload: {
          chainIds: [CHAIN_IDS.MAINNET],
          selectedAccountAddress: '',
        },
        testCase: 'the selected account address is not set',
      },
      {
        payload: {
          chainIds: ['xychain'],
          selectedAccountAddress: '0x123',
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
        };
      }) => {
        const {
          controller,
          spies: {
            tokensControllerAddTokensSpy,
            networkControllerFindNetworkClientIdByChainIdSpy,
            tokensControllerGetStateSpy,
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
        expect(tokensControllerGetStateSpy).not.toHaveBeenCalled();
        expect(tokensControllerAddTokensSpy).not.toHaveBeenCalled();
      },
    );

    it('does not execute the poll for a chain if the network client id is not found', async () => {
      const {
        controller,
        spies: {
          tokensControllerAddTokensSpy,
          networkControllerFindNetworkClientIdByChainIdSpy,
          tokensControllerGetStateSpy,
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
      });

      expect(fetchWithCacheSpy).not.toHaveBeenCalled();
      expect(tokensControllerGetStateSpy).not.toHaveBeenCalled();
      expect(tokensControllerAddTokensSpy).not.toHaveBeenCalled();
    });

    describe('fetchTopAssets', () => {
      it('does not add tokens to the TokensController if the fetch top assets fails', async () => {
        const {
          controller,
          spies: {
            tokensControllerAddTokensSpy,
            networkControllerFindNetworkClientIdByChainIdSpy,
            tokensControllerGetStateSpy,
            fetchWithCacheSpy,
          },
        } = setupController({
          supportedChains: [CHAIN_IDS.MAINNET],
        });
        networkControllerFindNetworkClientIdByChainIdSpy.mockResolvedValue(
          'mainnet',
        );
        tokensControllerGetStateSpy.mockResolvedValue({
          allIgnoredTokens: {},
        });
        tokensControllerAddTokensSpy.mockReturnThis();
        fetchWithCacheSpy.mockRejectedValue(
          new Error('Fetch top assets failed'),
        );

        await controller._executePoll({
          chainIds: [CHAIN_IDS.MAINNET],
          selectedAccountAddress: '0x123',
        });

        expect(tokensControllerAddTokensSpy).not.toHaveBeenCalled();
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
              tokensControllerAddTokensSpy,
              networkControllerFindNetworkClientIdByChainIdSpy,
              tokensControllerGetStateSpy,
              fetchWithCacheSpy,
            },
          } = setupController({
            supportedChains: [CHAIN_IDS.MAINNET],
          });
          networkControllerFindNetworkClientIdByChainIdSpy.mockResolvedValue(
            'mainnet',
          );
          tokensControllerGetStateSpy.mockResolvedValue({
            allIgnoredTokens: {},
          });
          tokensControllerAddTokensSpy.mockReturnThis();
          fetchWithCacheSpy.mockResolvedValue([...mockTopAssets, token]);

          await controller._executePoll({
            chainIds: [CHAIN_IDS.MAINNET],
            selectedAccountAddress: '0x123',
          });

          expect(
            networkControllerFindNetworkClientIdByChainIdSpy,
          ).toHaveBeenCalledWith(CHAIN_IDS.MAINNET);
          expect(tokensControllerGetStateSpy).toHaveBeenCalled();
          expect(tokensControllerAddTokensSpy).toHaveBeenCalledWith(
            [
              {
                address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                symbol: 'WETH',
                decimals: 18,
                name: 'Wrapped Ether',
                aggregators: [],
                image:
                  'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/erc20/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2.png',
              },
              {
                address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
                symbol: 'WBTC',
                decimals: 8,
                name: 'Wrapped Bitcoin',
                aggregators: [],
                image:
                  'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/erc20/0x2260fac5e5542a773aa44fbcfedf7c193bc2c599.png',
              },
            ],
            'mainnet',
          );
        },
      );
    });

    describe('filterIgnoredTokens', () => {
      it('filters the tokens if they are not ignored and adds them to the TokensController', async () => {
        const {
          controller,
          spies: {
            tokensControllerAddTokensSpy,
            networkControllerFindNetworkClientIdByChainIdSpy,
            tokensControllerGetStateSpy,
            fetchWithCacheSpy,
          },
        } = setupController({
          supportedChains: [CHAIN_IDS.MAINNET],
        });
        const ignoredTokens = {
          assetId: 'eip155:1/erc20:0xff20817765cb7f73d4bde2e66e067e58d11095c2',
          symbol: 'AMP',
          decimals: 18,
          name: 'Amp',
        };
        networkControllerFindNetworkClientIdByChainIdSpy.mockResolvedValue(
          'mainnet',
        );
        tokensControllerGetStateSpy.mockResolvedValue({
          allIgnoredTokens: {
            [CHAIN_IDS.MAINNET]: {
              '0x123': ['0xff20817765cb7f73d4bde2e66e067e58d11095c2'],
            },
          },
        });
        tokensControllerAddTokensSpy.mockReturnThis();
        fetchWithCacheSpy.mockResolvedValue([...mockTopAssets, ignoredTokens]);

        await controller._executePoll({
          chainIds: [CHAIN_IDS.MAINNET],
          selectedAccountAddress: '0x123',
        });

        expect(
          networkControllerFindNetworkClientIdByChainIdSpy,
        ).toHaveBeenCalledWith(CHAIN_IDS.MAINNET);
        expect(tokensControllerGetStateSpy).toHaveBeenCalled();
        expect(tokensControllerAddTokensSpy).toHaveBeenCalledWith(
          [
            {
              address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
              symbol: 'WETH',
              decimals: 18,
              name: 'Wrapped Ether',
              aggregators: [],
              image:
                'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/erc20/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2.png',
            },
            {
              address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
              symbol: 'WBTC',
              decimals: 8,
              name: 'Wrapped Bitcoin',
              aggregators: [],
              image:
                'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/erc20/0x2260fac5e5542a773aa44fbcfedf7c193bc2c599.png',
            },
          ],
          'mainnet',
        );
      });

      // @ts-expect-error This function is missing from the Mocha type definitions
      it.each([
        {
          testCase: 'allIgnoredTokens is not found',
          allIgnoredTokens: undefined,
        },
        {
          testCase: 'chainId is not in allIgnoredTokens',
          allIgnoredTokens: {},
        },
        {
          testCase: 'selectedAccountAddress is not in allIgnoredTokens',
          allIgnoredTokens: {
            [CHAIN_IDS.MAINNET]: {},
          },
        },
      ])(
        `does not filter the tokens if $testCase`,
        async ({
          allIgnoredTokens,
        }: {
          allIgnoredTokens: Record<string, Record<string, string[]>>;
        }) => {
          const {
            controller,
            spies: {
              tokensControllerAddTokensSpy,
              networkControllerFindNetworkClientIdByChainIdSpy,
              tokensControllerGetStateSpy,
              fetchWithCacheSpy,
            },
          } = setupController({
            supportedChains: [CHAIN_IDS.MAINNET],
          });
          networkControllerFindNetworkClientIdByChainIdSpy.mockResolvedValue(
            'mainnet',
          );
          tokensControllerGetStateSpy.mockResolvedValue({
            allIgnoredTokens,
          });
          tokensControllerAddTokensSpy.mockReturnThis();
          fetchWithCacheSpy.mockResolvedValue(mockTopAssets);

          await controller._executePoll({
            chainIds: [CHAIN_IDS.MAINNET],
            selectedAccountAddress: '0x123',
          });

          expect(tokensControllerAddTokensSpy).toHaveBeenCalledWith(
            [
              {
                address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                symbol: 'WETH',
                decimals: 18,
                name: 'Wrapped Ether',
                aggregators: [],
                image:
                  'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/erc20/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2.png',
              },
              {
                address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
                symbol: 'WBTC',
                decimals: 8,
                name: 'Wrapped Bitcoin',
                aggregators: [],
                image:
                  'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/erc20/0x2260fac5e5542a773aa44fbcfedf7c193bc2c599.png',
              },
            ],
            'mainnet',
          );
        },
      );
    });
  });
});
