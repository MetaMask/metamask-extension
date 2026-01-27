import localforage from 'localforage';
import nock from 'nock';
import { CaipAssetType, CaipChainId } from '@metamask/utils';
import { fetchPopularTokens, fetchTokensBySearchQuery } from './tokens';

const BRIDGE_API_BASE_URL = 'https://test.com';

const ETH_ASSET = {
  assetId: 'eip155:1/slip44:60' as CaipAssetType,
  symbol: 'ETH',
  name: 'Ether',
  decimals: 18,
  chainId: 'eip155:1',
};

const ETH_OPT_ASSET = {
  ...ETH_ASSET,
  chainId: 'eip155:10',
  assetId: 'eip155:10/slip44:60',
};

const MUSD_ASSET = {
  symbol: 'mUSD',
  name: 'MetaMask USD',
  decimals: 18,
  chainId: 'eip155:1',
  assetId: 'eip155:1/erc20:0xaca92e438df0b2401ff60da7e4337b687a2435da',
};

const INVALID_ASSET = {
  symbol: 'INVALIDTOKEN',
  name: 'INVALIDTOKEN Name',
  decimals: 18,
  chainId: 'eip155:1',
};

const USDC_ASSET = {
  symbol: 'USDC',
  name: 'USD Coin',
  decimals: 18,
  chainId: 'eip155:1',
  assetId: 'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
};

describe('Bridge token utils', () => {
  beforeEach(async () => {
    nock.cleanAll();
    jest.clearAllMocks();
    await localforage.clear();
  });

  describe('fetchPopularTokens', () => {
    it('should set and retrieve from cache when fetching popular tokens', async () => {
      nock(BRIDGE_API_BASE_URL)
        .persist()
        .post('/getTokens/popular')
        .reply((_, body) => {
          // @ts-expect-error - body contains chainIds key
          if (body.chainIds.includes('eip155:1')) {
            if (
              // @ts-expect-error - body contains includeAssets key
              body.includeAssets?.some(
                (asset: { assetId: string }) =>
                  asset.assetId === ETH_ASSET.assetId,
              )
            ) {
              return [200, [ETH_ASSET, MUSD_ASSET, INVALID_ASSET]];
            }
            return [200, [ETH_ASSET]];
          }
          // @ts-expect-error - body contains chainIds key
          if (body.chainIds.includes('eip155:10')) {
            return [200, [ETH_OPT_ASSET]];
          }

          return [500, []];
        });

      const params = {
        chainIds: ['eip155:1'] as CaipChainId[],
        signal: new AbortController().signal,
        clientId: 'test',
        bridgeApiBaseUrl: BRIDGE_API_BASE_URL,
      };

      await fetchPopularTokens(params);
      const [initialStorageKey] = await localforage.keys();
      const initialStorageItem = (await localforage.getItem(
        initialStorageKey,
      )) as string;
      expect(initialStorageItem).toBeDefined();

      await fetchPopularTokens({
        ...params,
        chainIds: ['eip155:10'],
      });
      const validatedTokens = await fetchPopularTokens({
        ...params,
        chainIds: ['eip155:1'],
        assetsWithBalances: [ETH_ASSET],
      });
      await fetchPopularTokens(params);

      const storageKeys = await localforage.keys();
      expect(storageKeys).toMatchInlineSnapshot(`
        [
          "bridgeCache:https://test.com/getTokens/popular:193595681026ad525f06b51481959f806ca8f03ffb5b7ab577d96c0f7d38f47d",
          "bridgeCache:https://test.com/getTokens/popular:2de47831d790515dce90c36340a0d87254ec17499e0d8139c18c74335cc3c087",
          "bridgeCache:https://test.com/getTokens/popular:6c2b7a5dbd3858f1ef52702a157b3ab7480d0505501180793ea880ce2e63a34e",
        ]
      `);

      expect(
        JSON.parse((await localforage.getItem(storageKeys[0])) ?? '{}')
          .lastUpdated,
      ).toStrictEqual(JSON.parse(initialStorageItem)?.lastUpdated);
      expect(
        JSON.parse((await localforage.getItem(storageKeys[0])) ?? '{}').default,
      ).toMatchInlineSnapshot(`
        {
          "cachedResponse": [
            {
              "assetId": "eip155:1/slip44:60",
              "chainId": "eip155:1",
              "decimals": 18,
              "name": "Ether",
              "symbol": "ETH",
            },
          ],
          "hash": "4c6df8735e6f64e8a41aab8ff4262e57944a354b7ba3880189e0cff1d0020fea",
        }
      `);
      expect(
        JSON.parse((await localforage.getItem(storageKeys[1])) ?? '{}').default,
      ).toMatchInlineSnapshot(`
        {
          "cachedResponse": [
            {
              "assetId": "eip155:10/slip44:60",
              "chainId": "eip155:10",
              "decimals": 18,
              "name": "Ether",
              "symbol": "ETH",
            },
          ],
          "hash": "f1642fd999ae4feead10967a054e5646fa3aa7cd63cf8d54055cb04462b7597f",
        }
      `);
      expect(
        JSON.parse((await localforage.getItem(storageKeys[2])) ?? '{}').default,
      ).toMatchInlineSnapshot(`
        {
          "cachedResponse": [
            {
              "assetId": "eip155:1/slip44:60",
              "chainId": "eip155:1",
              "decimals": 18,
              "name": "Ether",
              "symbol": "ETH",
            },
            {
              "assetId": "eip155:1/erc20:0xaca92e438df0b2401ff60da7e4337b687a2435da",
              "chainId": "eip155:1",
              "decimals": 18,
              "name": "MetaMask USD",
              "symbol": "mUSD",
            },
            {
              "chainId": "eip155:1",
              "decimals": 18,
              "name": "INVALIDTOKEN Name",
              "symbol": "INVALIDTOKEN",
            },
          ],
          "hash": "632f8d10309be5a3abb9790eafa3b973f51711d3efcc477fdead94dfed0280f5",
        }
      `);
      expect(validatedTokens).toMatchInlineSnapshot(`
        [
          {
            "assetId": "eip155:1/slip44:60",
            "chainId": "eip155:1",
            "decimals": 18,
            "name": "Ether",
            "symbol": "ETH",
          },
          {
            "assetId": "eip155:1/erc20:0xaca92e438df0b2401ff60da7e4337b687a2435da",
            "chainId": "eip155:1",
            "decimals": 18,
            "name": "MetaMask USD",
            "symbol": "mUSD",
          },
        ]
      `);
    });

    it('should invalidate cache when hash is invalid', async () => {
      nock(BRIDGE_API_BASE_URL)
        .persist()
        .post('/getTokens/popular')
        .reply((_, body) => {
          // @ts-expect-error - body contains chainIds key
          if (body.chainIds.includes('eip155:1')) {
            return [200, [ETH_ASSET]];
          }
          return [500, []];
        });

      const params = {
        chainIds: ['eip155:1'] as CaipChainId[],
        signal: new AbortController().signal,
        clientId: 'test',
        bridgeApiBaseUrl: BRIDGE_API_BASE_URL,
      };
      await fetchPopularTokens(params);
      const storageKeys = await localforage.keys();
      const [initialStorageKey] = storageKeys;
      const initialStorageItem = JSON.parse(
        (await localforage.getItem(initialStorageKey)) ?? '{}',
      );
      expect(initialStorageItem?.default).toMatchInlineSnapshot(`
        {
          "cachedResponse": [
            {
              "assetId": "eip155:1/slip44:60",
              "chainId": "eip155:1",
              "decimals": 18,
              "name": "Ether",
              "symbol": "ETH",
            },
          ],
          "hash": "4c6df8735e6f64e8a41aab8ff4262e57944a354b7ba3880189e0cff1d0020fea",
        }
      `);

      await localforage.setItem(initialStorageKey, {
        ...initialStorageItem,
        default: {
          ...initialStorageItem.default,
          cachedResponse: [
            ...initialStorageItem.default.cachedResponse,
            {
              symbol: 'INVALIDTOKEN',
            },
          ],
        },
      });
      await fetchPopularTokens(params);

      expect(storageKeys).toMatchInlineSnapshot(`
        [
          "bridgeCache:https://test.com/getTokens/popular:193595681026ad525f06b51481959f806ca8f03ffb5b7ab577d96c0f7d38f47d",
        ]
      `);

      const storageItem = JSON.parse(
        (await localforage.getItem(storageKeys[0])) ?? '{}',
      ) as {
        lastUpdated: number;
        default: { cachedResponse: unknown; hash: string };
      };
      expect(storageItem.default).toMatchInlineSnapshot(`
        {
          "cachedResponse": [
            {
              "assetId": "eip155:1/slip44:60",
              "chainId": "eip155:1",
              "decimals": 18,
              "name": "Ether",
              "symbol": "ETH",
            },
          ],
          "hash": "4c6df8735e6f64e8a41aab8ff4262e57944a354b7ba3880189e0cff1d0020fea",
        }
      `);

      expect(storageItem?.lastUpdated).toBeGreaterThan(
        initialStorageItem?.lastUpdated,
      );
    });
  });

  describe('fetchTokensBySearchQuery', () => {
    it('should add pages to cache when fetching tokens by search query', async () => {
      nock(BRIDGE_API_BASE_URL)
        .persist()
        .post('/getTokens/search')
        .reply((_, body) => {
          // @ts-expect-error - body contains after key
          if (body.after === undefined) {
            return [
              200,
              {
                data: [ETH_ASSET],
                pageInfo: {
                  hasNextPage: true,
                  endCursor: '123',
                },
              },
            ];
          }
          // @ts-expect-error - body contains after key
          if (body.after === '123') {
            return [
              200,
              {
                data: [MUSD_ASSET, INVALID_ASSET],
                pageInfo: {
                  hasNextPage: true,
                  endCursor: '456',
                },
              },
            ];
          }

          // @ts-expect-error - body contains after key
          if (body.after === '456') {
            return [
              200,
              {
                data: [USDC_ASSET],
                pageInfo: {
                  hasNextPage: false,
                  endCursor: undefined,
                },
              },
            ];
          }
          return [500];
        });

      const params = {
        chainIds: ['eip155:1'] as CaipChainId[],
        query: 'USD',
        clientId: 'test',
        bridgeApiBaseUrl: BRIDGE_API_BASE_URL,
        signal: new AbortController().signal,
      };

      const { endCursor } = await fetchTokensBySearchQuery(params);

      const { endCursor: endCursor2 } = await fetchTokensBySearchQuery({
        ...params,
        after: endCursor,
      });
      const [initialStorageKey] = await localforage.keys();
      const initialStorageItem = (await localforage.getItem(
        initialStorageKey,
      )) as string;

      await fetchTokensBySearchQuery({
        ...params,
        after: endCursor2,
      });

      await fetchTokensBySearchQuery(params);

      const storageKeys = await localforage.keys();
      expect(storageKeys).toMatchInlineSnapshot(`
        [
          "bridgeCache:https://test.com/getTokens/search:bd4a8748f7f23491e9e389e9aee7f4dab236ac7961a15ac185f522459ca953f0",
        ]
      `);

      const { lastUpdated, ...storageItem } = JSON.parse(
        (await localforage.getItem(storageKeys[0])) ?? '{}',
      );
      expect(lastUpdated).toBeGreaterThan(
        JSON.parse(initialStorageItem)?.lastUpdated,
      );
      expect(storageItem).toMatchInlineSnapshot(`
        {
          "123": {
            "cachedResponse": {
              "data": [
                {
                  "assetId": "eip155:1/erc20:0xaca92e438df0b2401ff60da7e4337b687a2435da",
                  "chainId": "eip155:1",
                  "decimals": 18,
                  "name": "MetaMask USD",
                  "symbol": "mUSD",
                },
                {
                  "chainId": "eip155:1",
                  "decimals": 18,
                  "name": "INVALIDTOKEN Name",
                  "symbol": "INVALIDTOKEN",
                },
              ],
              "pageInfo": {
                "endCursor": "456",
                "hasNextPage": true,
              },
            },
            "hash": "428186c97ce1739748320496dd137d34b1caac2edd2e35016ce623e86a15f54a",
          },
          "456": {
            "cachedResponse": {
              "data": [
                {
                  "assetId": "eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                  "chainId": "eip155:1",
                  "decimals": 18,
                  "name": "USD Coin",
                  "symbol": "USDC",
                },
              ],
              "pageInfo": {
                "hasNextPage": false,
              },
            },
            "hash": "2abbbe3bcc031c753eaf93d1f98f15c512b27998e843465e2e12a6fddc911897",
          },
          "default": {
            "cachedResponse": {
              "data": [
                {
                  "assetId": "eip155:1/slip44:60",
                  "chainId": "eip155:1",
                  "decimals": 18,
                  "name": "Ether",
                  "symbol": "ETH",
                },
              ],
              "pageInfo": {
                "endCursor": "123",
                "hasNextPage": true,
              },
            },
            "hash": "7f0e83a016513b8d95fb34df8f6617e47d45f4be8b5752308945892f8f04447c",
          },
        }
      `);
    });
  });
});
