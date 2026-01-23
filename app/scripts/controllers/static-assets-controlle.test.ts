/**
 * @jest-environment node
 */
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
    assetId: 'eip155:1/erc20:0x111111111117dc0aa78b770fa6a738034120c302',
    symbol: '1INCH',
    decimals: 18,
    name: '1INCH Token',
    coingeckoId: '1inch',
    aggregators: [],
    occurrences: 10,
    iconUrl:
      'https://raw.githubusercontent.com/MetaMask/contract-metadata/master/icons/eip155:1/erc20:0x111111111117dC0aa78b770fA6A738034120C302.svg',
    metadata: {
      createdAt: '2023-10-31T22:41:58.553Z',
    },
  },
  {
    assetId: 'eip155:1/erc20:0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
    symbol: 'AAVE',
    decimals: 18,
    name: 'Aave',
    coingeckoId: 'aave',
    aggregators: [],
    occurrences: 10,
    iconUrl: '',
    metadata: {
      createdAt: '2023-10-31T22:41:58.553Z',
    },
  },
];

const setupController = ({
  supportedChains,
}: {
  supportedChains: string[];
}) => {
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
    supportedChains,
    interval: 1000,
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

describe('staticAssetscontroller', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('_executePoll', () => {
    it('fetchs top assets for a chain and add them to the TokensController', async () => {
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
      fetchWithCacheSpy.mockResolvedValue({
        data: [...mockTopAssets],
      });

      await controller._executePoll({
        chainIds: [CHAIN_IDS.MAINNET],
        selectedAccountAddress: '0x123',
      });

      expect(fetchWithCacheSpy).toHaveBeenCalledWith({
        url: expect.stringContaining(
          'https://tokens.api.cx.metamask.io/v3/chains/eip155:1/assets',
        ),
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
            address: '0x111111111117dc0aa78b770fa6a738034120c302',
            symbol: '1INCH',
            decimals: 18,
            name: '1INCH Token',
            aggregators: [],
            image:
              'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/erc20/0x111111111117dc0aa78b770fa6a738034120c302.svg',
          },
          {
            address: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
            symbol: 'AAVE',
            decimals: 18,
            name: 'Aave',
            aggregators: [],
            image: '',
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

      it('ignores the token that fails to transform', async () => {
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
        fetchWithCacheSpy.mockResolvedValue({
          data: [
            ...mockTopAssets,
            {
              // omit the assetId to let the transformTopAsset function fail
              symbol: 'AMP',
              decimals: 18,
              name: 'Amp',
              aggregators: [],
              occurrences: 10,
              iconUrl:
                'https://tokens.1inch.io/0xff20817765cb7f73d4bde2e66e067e58d11095c2.png',
              metadata: {
                createdAt: '2023-10-31T22:41:58.553Z',
              },
            },
          ],
        });

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
              address: '0x111111111117dc0aa78b770fa6a738034120c302',
              symbol: '1INCH',
              decimals: 18,
              name: '1INCH Token',
              aggregators: [],
              image:
                'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/erc20/0x111111111117dc0aa78b770fa6a738034120c302.svg',
            },
            {
              address: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
              symbol: 'AAVE',
              decimals: 18,
              name: 'Aave',
              aggregators: [],
              image: '',
            },
          ],
          'mainnet',
        );
      });
    });

    describe('filterIgnoredTokens', () => {
      it('filters the tokens it they are not ignored and add them to the TokensController', async () => {
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
          aggregators: [],
          occurrences: 10,
          iconUrl:
            'https://tokens.1inch.io/0xff20817765cb7f73d4bde2e66e067e58d11095c2.png',
          metadata: {
            createdAt: '2023-10-31T22:41:58.553Z',
          },
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
        fetchWithCacheSpy.mockResolvedValue({
          data: [...mockTopAssets, ignoredTokens],
        });

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
              address: '0x111111111117dc0aa78b770fa6a738034120c302',
              symbol: '1INCH',
              decimals: 18,
              name: '1INCH Token',
              aggregators: [],
              image:
                'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/erc20/0x111111111117dc0aa78b770fa6a738034120c302.svg',
            },
            {
              address: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
              symbol: 'AAVE',
              decimals: 18,
              name: 'Aave',
              aggregators: [],
              image: '',
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
          fetchWithCacheSpy.mockResolvedValue({
            data: [...mockTopAssets],
          });

          await controller._executePoll({
            chainIds: [CHAIN_IDS.MAINNET],
            selectedAccountAddress: '0x123',
          });

          expect(tokensControllerAddTokensSpy).toHaveBeenCalledWith(
            [
              {
                address: '0x111111111117dc0aa78b770fa6a738034120c302',
                symbol: '1INCH',
                decimals: 18,
                name: '1INCH Token',
                aggregators: [],
                image:
                  'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/erc20/0x111111111117dc0aa78b770fa6a738034120c302.svg',
              },
              {
                address: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
                symbol: 'AAVE',
                decimals: 18,
                name: 'Aave',
                aggregators: [],
                image: '',
              },
            ],
            'mainnet',
          );
        },
      );
    });
  });
});
