import { migrate } from './091';

describe('migration #91', () => {
  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: 88 },
      data: {},
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta).toStrictEqual({ version: 91 });
  });

  it('returns the state unaltered if it has no NftController property', async () => {
    const oldData = {
      some: 'data',
    };
    const oldStorage = {
      meta: { version: 88 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('returns the state unaltered if the NftController object has no allNftContracts property', async () => {
    const oldData = {
      NftController: {
        some: 'data',
      },
    };
    const oldStorage = {
      meta: { version: 88 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('returns the state unaltered if NftController.allNftContracts is not an object', async () => {
    const oldData = {
      NftController: {
        allNftContracts: 'foo',
      },
    };
    const oldStorage = {
      meta: { version: 88 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('returns the state unaltered if any value of the NftController.allNftContracts object is not an object itself', async () => {
    const oldData = {
      NftController: {
        allNftContracts: {
          '0x111': {
            '123': 'foo',
          },
          '0x222': 'bar',
        },
      },
    };
    const oldStorage = {
      meta: { version: 88 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('rewrites NftController.allNftContracts so that hex chain IDs are converted to caip chain IDs', async () => {
    const oldStorage = {
      meta: { version: 88 },
      data: {
        NftController: {
          allNftContracts: {
            '0x111': {
              '0x10': [
                {
                  name: 'Contract 1',
                  address: '0xaaa',
                },
              ],
              '0x20': [
                {
                  name: 'Contract 2',
                  address: '0xbbb',
                },
              ],
            },
            '0x222': {
              '0x40': [
                {
                  name: 'Contract 3',
                  address: '0xccc',
                },
              ],
              '0x80': [
                {
                  name: 'Contract 4',
                  address: '0xddd',
                },
              ],
            },
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual({
      NftController: {
        allNftContracts: {
          '0x111': {
            'eip155:16': [
              {
                name: 'Contract 1',
                address: '0xaaa',
              },
            ],
            'eip155:32': [
              {
                name: 'Contract 2',
                address: '0xbbb',
              },
            ],
          },
          '0x222': {
            'eip155:64': [
              {
                name: 'Contract 3',
                address: '0xccc',
              },
            ],
            'eip155:128': [
              {
                name: 'Contract 4',
                address: '0xddd',
              },
            ],
          },
        },
      },
    });
  });

  it('returns the state unaltered if the NftController object has no allNfts property', async () => {
    const oldData = {
      NftController: {
        some: 'data',
      },
    };
    const oldStorage = {
      meta: { version: 88 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('returns the state unaltered if NftController.allNfts is not an object', async () => {
    const oldData = {
      NftController: {
        allNfts: 'foo',
      },
    };
    const oldStorage = {
      meta: { version: 88 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('returns the state unaltered if any value of the NftController.allNfts object is not an object itself', async () => {
    const oldData = {
      NftController: {
        allNfts: {
          '0x111': {
            '123': 'foo',
          },
          '0x222': 'bar',
        },
      },
    };
    const oldStorage = {
      meta: { version: 88 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('rewrites NftController.allNfts so that hex chain IDs are converted to caip chain IDs', async () => {
    const oldStorage = {
      meta: { version: 88 },
      data: {
        NftController: {
          allNfts: {
            '0x111': {
              '0x10': [
                {
                  name: 'NFT 1',
                  description: 'Description for NFT 1',
                  image: 'nft1.jpg',
                  standard: 'ERC721',
                  tokenId: '1',
                  address: '0xaaa',
                },
              ],
              '0x20': [
                {
                  name: 'NFT 2',
                  description: 'Description for NFT 2',
                  image: 'nft2.jpg',
                  standard: 'ERC721',
                  tokenId: '2',
                  address: '0xbbb',
                },
              ],
            },
            '0x222': {
              '0x40': [
                {
                  name: 'NFT 3',
                  description: 'Description for NFT 3',
                  image: 'nft3.jpg',
                  standard: 'ERC721',
                  tokenId: '3',
                  address: '0xccc',
                },
              ],
              '0x80': [
                {
                  name: 'NFT 4',
                  description: 'Description for NFT 4',
                  image: 'nft4.jpg',
                  standard: 'ERC721',
                  tokenId: '4',
                  address: '0xddd',
                },
              ],
            },
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual({
      NftController: {
        allNfts: {
          '0x111': {
            'eip155:16': [
              {
                name: 'NFT 1',
                description: 'Description for NFT 1',
                image: 'nft1.jpg',
                standard: 'ERC721',
                tokenId: '1',
                address: '0xaaa',
              },
            ],
            'eip155:32': [
              {
                name: 'NFT 2',
                description: 'Description for NFT 2',
                image: 'nft2.jpg',
                standard: 'ERC721',
                tokenId: '2',
                address: '0xbbb',
              },
            ],
          },
          '0x222': {
            'eip155:64': [
              {
                name: 'NFT 3',
                description: 'Description for NFT 3',
                image: 'nft3.jpg',
                standard: 'ERC721',
                tokenId: '3',
                address: '0xccc',
              },
            ],
            'eip155:128': [
              {
                name: 'NFT 4',
                description: 'Description for NFT 4',
                image: 'nft4.jpg',
                standard: 'ERC721',
                tokenId: '4',
                address: '0xddd',
              },
            ],
          },
        },
      },
    });
  });

  it('returns the state unaltered if it has no TokenListController property', async () => {
    const oldData = {
      some: 'data',
    };
    const oldStorage = {
      meta: { version: 88 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('returns the state unaltered if the TokenListController object has no tokensChainsCache property', async () => {
    const oldData = {
      TokenListController: {
        some: 'data',
      },
    };
    const oldStorage = {
      meta: { version: 88 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('returns the state unaltered if TokenListController.tokensChainsCache is not an object', async () => {
    const oldData = {
      TokenListController: {
        tokensChainsCache: 'foo',
      },
    };
    const oldStorage = {
      meta: { version: 88 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('rewrites TokenListController.tokensChainsCache so that hex chain IDs are converted to caip chain IDs', async () => {
    const oldStorage = {
      meta: { version: 88 },
      data: {
        TokenListController: {
          tokensChainsCache: {
            '0x10': {
              timestamp: 111111,
              data: {
                '0x111': {
                  address: '0x111',
                  symbol: 'TEST1',
                  decimals: 1,
                  occurrences: 1,
                  name: 'Token 1',
                  iconUrl: 'https://url/to/token1.png',
                  aggregators: [],
                },
              },
            },
            '0x20': {
              timestamp: 222222,
              data: {
                '0x222': {
                  address: '0x222',
                  symbol: 'TEST2',
                  decimals: 1,
                  occurrences: 1,
                  name: 'Token 2',
                  iconUrl: 'https://url/to/token2.png',
                  aggregators: [],
                },
              },
            },
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual({
      TokenListController: {
        tokensChainsCache: {
          'eip155:16': {
            timestamp: 111111,
            data: {
              '0x111': {
                address: '0x111',
                symbol: 'TEST1',
                decimals: 1,
                occurrences: 1,
                name: 'Token 1',
                iconUrl: 'https://url/to/token1.png',
                aggregators: [],
              },
            },
          },
          'eip155:32': {
            timestamp: 222222,
            data: {
              '0x222': {
                address: '0x222',
                symbol: 'TEST2',
                decimals: 1,
                occurrences: 1,
                name: 'Token 2',
                iconUrl: 'https://url/to/token2.png',
                aggregators: [],
              },
            },
          },
        },
      },
    });
  });

  it('returns the state unaltered if it has no TokensController property', async () => {
    const oldData = {
      some: 'data',
    };
    const oldStorage = {
      meta: { version: 88 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('returns the state unaltered if the TokensController object has no allTokens property', async () => {
    const oldData = {
      TokensController: {
        some: 'data',
      },
    };
    const oldStorage = {
      meta: { version: 88 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('returns the state unaltered if TokensController.allTokens is not an object', async () => {
    const oldData = {
      TokensController: {
        allTokens: 'foo',
      },
    };
    const oldStorage = {
      meta: { version: 88 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('rewrites TokensController.allTokens so that hex chain IDs are converted to caip chain IDs', async () => {
    const oldStorage = {
      meta: { version: 88 },
      data: {
        TokensController: {
          allTokens: {
            '0x10': {
              '0x111': [
                {
                  address: '0xaaa',
                  decimals: 1,
                  symbol: 'TEST1',
                },
              ],
            },
            '0x20': {
              '0x222': [
                {
                  address: '0xbbb',
                  decimals: 1,
                  symbol: 'TEST2',
                },
              ],
            },
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual({
      TokensController: {
        allTokens: {
          'eip155:16': {
            '0x111': [
              {
                address: '0xaaa',
                decimals: 1,
                symbol: 'TEST1',
              },
            ],
          },
          'eip155:32': {
            '0x222': [
              {
                address: '0xbbb',
                decimals: 1,
                symbol: 'TEST2',
              },
            ],
          },
        },
      },
    });
  });

  it('returns the state unaltered if the TokensController object has no allIgnoredTokens property', async () => {
    const oldData = {
      TokensController: {
        some: 'data',
      },
    };
    const oldStorage = {
      meta: { version: 88 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('returns the state unaltered if TokensController.allIgnoredTokens is not an object', async () => {
    const oldData = {
      TokensController: {
        allIgnoredTokens: 'foo',
      },
    };
    const oldStorage = {
      meta: { version: 88 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('rewrites TokensController.allIgnoredTokens so that hex chain IDs are converted to caip chain IDs', async () => {
    const oldStorage = {
      meta: { version: 88 },
      data: {
        TokensController: {
          allIgnoredTokens: {
            '0x10': {
              '0x1': {
                '0x111': ['0xaaa'],
              },
            },
            '0x20': {
              '0x2': {
                '0x222': ['0xbbb'],
              },
            },
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual({
      TokensController: {
        allIgnoredTokens: {
          'eip155:16': {
            '0x1': {
              '0x111': ['0xaaa'],
            },
          },
          'eip155:32': {
            '0x2': {
              '0x222': ['0xbbb'],
            },
          },
        },
      },
    });
  });

  it('returns the state unaltered if the TokensController object has no allDetectedTokens property', async () => {
    const oldData = {
      TokensController: {
        some: 'data',
      },
    };
    const oldStorage = {
      meta: { version: 88 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('returns the state unaltered if TokensController.allDetectedTokens is not an object', async () => {
    const oldData = {
      TokensController: {
        allDetectedTokens: 'foo',
      },
    };
    const oldStorage = {
      meta: { version: 88 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('rewrites TokensController.allDetectedTokens so that hex chain IDs are converted to caip chain IDs', async () => {
    const oldStorage = {
      meta: { version: 88 },
      data: {
        TokensController: {
          allDetectedTokens: {
            '0x10': {
              '0x1': {
                '0x111': ['0xaaa'],
              },
            },
            '0x20': {
              '0x2': {
                '0x222': ['0xbbb'],
              },
            },
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual({
      TokensController: {
        allDetectedTokens: {
          'eip155:16': {
            '0x1': {
              '0x111': ['0xaaa'],
            },
          },
          'eip155:32': {
            '0x2': {
              '0x222': ['0xbbb'],
            },
          },
        },
      },
    });
  });

  it('returns the state unaltered if it has no NetworkController property', async () => {
    const oldData = {
      some: 'data',
    };
    const oldStorage = {
      meta: { version: 88 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('returns the state unaltered if the NetworkController object has no providerConfig property', async () => {
    const oldData = {
      NetworkController: {
        some: 'data',
      },
    };
    const oldStorage = {
      meta: { version: 88 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('returns the state unaltered if NetworkController.providerConfig is not an object', async () => {
    const oldData = {
      NetworkController: {
        providerConfig: 'foo',
      },
    };
    const oldStorage = {
      meta: { version: 88 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  // is it possible for this to be decimal too?
  it('rewrites NetworkController.providerConfig so that hex `chainId` is converted to `caipChainId`', async () => {
    const oldStorage = {
      meta: { version: 88 },
      data: {
        NetworkController: {
          providerConfig: {
            chainId: '0x539',
            id: 'b5c4f470-cc3e-4135-9509-42e9a5059b17',
            nickname: 'Localhost',
            rpcPrefs: {
              blockExplorerUrl: null,
            },
            rpcUrl: 'http://127.0.0.1:7545',
            ticker: 'TEST',
            type: 'rpc',
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual({
      NetworkController: {
        providerConfig: {
          caipChainId: 'eip155:1337',
          id: 'b5c4f470-cc3e-4135-9509-42e9a5059b17',
          nickname: 'Localhost',
          rpcPrefs: {
            blockExplorerUrl: null,
          },
          rpcUrl: 'http://127.0.0.1:7545',
          ticker: 'TEST',
          type: 'rpc',
        },
      },
    });
  });

  it('returns the state unaltered if the NetworkController object has no networkConfigurations property', async () => {
    const oldData = {
      NetworkController: {
        some: 'data',
      },
    };
    const oldStorage = {
      meta: { version: 88 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('returns the state unaltered if NetworkController.networkConfigurations is not an object', async () => {
    const oldData = {
      NetworkController: {
        networkConfigurations: 'foo',
      },
    };
    const oldStorage = {
      meta: { version: 88 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  // is it possible for these to be decimal too?
  it('rewrites NetworkController.networkConfigurations so that hex `chainId` are converted to `caipChainId`', async () => {
    const oldStorage = {
      meta: { version: 88 },
      data: {
        NetworkController: {
          networkConfigurations: {
            'network-id-1': {
              chainId: '0x539',
              id: 'network-id-1',
              nickname: 'Localhost',
              rpcPrefs: {
                blockExplorerUrl: null,
              },
              rpcUrl: 'http://127.0.0.1:7545',
              ticker: 'TEST',
            },
            'network-id-2': {
              chainId: '0x64',
              id: 'network-id-2',
              nickname: 'Gnosis',
              rpcPrefs: {
                blockExplorerUrl: 'https://blockscout.com/poa/xdai/',
              },
              rpcUrl: 'https://rpc.ankr.com/gnosis',
              ticker: 'xDAI',
            },
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual({
      NetworkController: {
        networkConfigurations: {
          'network-id-1': {
            caipChainId: 'eip155:1337',
            id: 'network-id-1',
            nickname: 'Localhost',
            rpcPrefs: {
              blockExplorerUrl: null,
            },
            rpcUrl: 'http://127.0.0.1:7545',
            ticker: 'TEST',
          },
          'network-id-2': {
            caipChainId: 'eip155:100',
            id: 'network-id-2',
            nickname: 'Gnosis',
            rpcPrefs: {
              blockExplorerUrl: 'https://blockscout.com/poa/xdai/',
            },
            rpcUrl: 'https://rpc.ankr.com/gnosis',
            ticker: 'xDAI',
          },
        },
      },
    });
  });

  it('returns the state unaltered if it has no CachedBalancesController property', async () => {
    const oldData = {
      some: 'data',
    };
    const oldStorage = {
      meta: { version: 88 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('returns the state unaltered if the CachedBalancesController object has no cachedBalances property', async () => {
    const oldData = {
      CachedBalancesController: {
        some: 'data',
      },
    };
    const oldStorage = {
      meta: { version: 88 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('returns the state unaltered if CachedBalancesController.cachedBalances is not an object', async () => {
    const oldData = {
      CachedBalancesController: {
        cachedBalances: 'foo',
      },
    };
    const oldStorage = {
      meta: { version: 88 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  // is it possible for this to be decimal too?
  it('rewrites CachedBalancesController.cachedBalances so that hex chain IDs are converted to caip chain IDs', async () => {
    const oldStorage = {
      meta: { version: 88 },
      data: {
        CachedBalancesController: {
          cachedBalances: {
            '0x10': {
              '0x01': '0x100',
              '0x02': '0x200',
            },
            '0x20': {
              '0x03': '0x300',
              '0x04': '0x400',
            },
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual({
      CachedBalancesController: {
        cachedBalances: {
          'eip155:16': {
            '0x01': '0x100',
            '0x02': '0x200',
          },
          'eip155:32': {
            '0x03': '0x300',
            '0x04': '0x400',
          },
        },
      },
    });
  });

  it('returns the state unaltered if it has no AddressBookController property', async () => {
    const oldData = {
      some: 'data',
    };
    const oldStorage = {
      meta: { version: 88 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('returns the state unaltered if the AddressBookController object has no addressBook property', async () => {
    const oldData = {
      AddressBookController: {
        some: 'data',
      },
    };
    const oldStorage = {
      meta: { version: 88 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('returns the state unaltered if AddressBookController.addressBook is not an object', async () => {
    const oldData = {
      AddressBookController: {
        addressBook: 'foo',
      },
    };
    const oldStorage = {
      meta: { version: 88 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  // is it possible for this to be decimal too?
  it('rewrites AddressBookController.addressBook so that hex chain IDs are converted to caip chain IDs', async () => {
    const oldStorage = {
      meta: { version: 88 },
      data: {
        AddressBookController: {
          addressBook: {
            '0x10': {
              '0x01': {
                address: '0x01',
                chainId: '0x10',
                isEns: false,
                memo: '',
                name: '',
              },
              '0x02': {
                address: '0x02',
                chainId: '0x10',
                isEns: false,
                memo: '',
                name: 'test',
              },
            },
            '0x20': {
              '0x03': {
                address: '0x03',
                chainId: '0x20',
                isEns: false,
                memo: '',
                name: '',
              },
              '0x04': {
                address: '0x04',
                chainId: '0x20',
                isEns: false,
                memo: '',
                name: 'test',
              },
            },
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual({
      AddressBookController: {
        addressBook: {
          'eip155:16': {
            '0x01': {
              address: '0x01',
              caipChainId: 'eip155:16',
              isEns: false,
              memo: '',
              name: '',
            },
            '0x02': {
              address: '0x02',
              caipChainId: 'eip155:16',
              isEns: false,
              memo: '',
              name: 'test',
            },
          },
          'eip155:32': {
            '0x03': {
              address: '0x03',
              caipChainId: 'eip155:32',
              isEns: false,
              memo: '',
              name: '',
            },
            '0x04': {
              address: '0x04',
              caipChainId: 'eip155:32',
              isEns: false,
              memo: '',
              name: 'test',
            },
          },
        },
      },
    });
  });

  it('returns the state unaltered if it has no AppStateController property', async () => {
    const oldData = {
      some: 'data',
    };
    const oldStorage = {
      meta: { version: 88 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('returns the state unaltered if the AppStateController object has no usedNetworks property', async () => {
    const oldData = {
      AppStateController: {
        some: 'data',
      },
    };
    const oldStorage = {
      meta: { version: 88 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('returns the state unaltered if AppStateController.usedNetworks is not an object', async () => {
    const oldData = {
      AppStateController: {
        usedNetworks: 'foo',
      },
    };
    const oldStorage = {
      meta: { version: 88 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  // is it possible for this to be decimal too?
  it('rewrites AppStateController.usedNetworks so that hex chain IDs are converted to caip chain IDs', async () => {
    const oldStorage = {
      meta: { version: 88 },
      data: {
        AppStateController: {
          usedNetworks: {
            '0x10': true,
            '0x20': true,
            '0x40': true,
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual({
      AppStateController: {
        usedNetworks: {
          'eip155:16': true,
          'eip155:32': true,
          'eip155:64': true,
        },
      },
    });
  });

  it('returns the state unaltered if it has no IncomingTransactionsController property', async () => {
    const oldData = {
      some: 'data',
    };
    const oldStorage = {
      meta: { version: 88 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('returns the state unaltered if the IncomingTransactionsController object has no incomingTransactions property', async () => {
    const oldData = {
      IncomingTransactionsController: {
        some: 'data',
      },
    };
    const oldStorage = {
      meta: { version: 88 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('returns the state unaltered if IncomingTransactionsController.incomingTransactions is not an object', async () => {
    const oldData = {
      IncomingTransactionsController: {
        incomingTransactions: 'foo',
      },
    };
    const oldStorage = {
      meta: { version: 88 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  // is it possible for this to be decimal too?
  it('rewrites IncomingTransactionsController.incomingTransactions so that hex `chainId` are converted to `caipChainId`', async () => {
    const oldStorage = {
      meta: { version: 88 },
      data: {
        IncomingTransactionsController: {
          incomingTransactions: {
            '0xhash1': {
              blockNumber: '1',
              chainId: '0x5',
              hash: '0xhash1',
              id: 835722787156093,
              metamaskNetworkId: '5',
              status: 'confirmed',
              time: 1686340464000,
              txParams: {
                from: '0x1',
                gas: '0x2',
                gasPrice: '0x3',
                nonce: '0x4',
                to: '0x5',
                value: '0x6',
              },
              type: 'incoming',
            },
            '0xhash2': {
              blockNumber: '2',
              chainId: '0x5',
              hash: '0xhash2',
              id: 835722787156093,
              metamaskNetworkId: '5',
              status: 'confirmed',
              time: 1686340464001,
              txParams: {
                from: '0x21',
                gas: '0x22',
                gasPrice: '0x23',
                nonce: '0x24',
                to: '0x25',
                value: '0x26',
              },
              type: 'incoming',
            },
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual({
      IncomingTransactionsController: {
        incomingTransactions: {
          '0xhash1': {
            blockNumber: '1',
            caipChainId: 'eip155:5',
            hash: '0xhash1',
            id: 835722787156093,
            metamaskNetworkId: '5',
            status: 'confirmed',
            time: 1686340464000,
            txParams: {
              from: '0x1',
              gas: '0x2',
              gasPrice: '0x3',
              nonce: '0x4',
              to: '0x5',
              value: '0x6',
            },
            type: 'incoming',
          },
          '0xhash2': {
            blockNumber: '2',
            caipChainId: 'eip155:5',
            hash: '0xhash2',
            id: 835722787156093,
            metamaskNetworkId: '5',
            status: 'confirmed',
            time: 1686340464001,
            txParams: {
              from: '0x21',
              gas: '0x22',
              gasPrice: '0x23',
              nonce: '0x24',
              to: '0x25',
              value: '0x26',
            },
            type: 'incoming',
          },
        },
      },
    });
  });

  it('returns the state unaltered if the IncomingTransactionsController object has no incomingTxLastFetchedBlockByChainId property', async () => {
    const oldData = {
      IncomingTransactionsController: {
        some: 'data',
      },
    };
    const oldStorage = {
      meta: { version: 88 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('returns the state unaltered if IncomingTransactionsController.incomingTxLastFetchedBlockByChainId is not an object', async () => {
    const oldData = {
      IncomingTransactionsController: {
        incomingTxLastFetchedBlockByChainId: 'foo',
      },
    };
    const oldStorage = {
      meta: { version: 88 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  // is it possible for this to be decimal too?
  it('rewrites IncomingTransactionsController.incomingTxLastFetchedBlockByChainId so that hex `chainId` are converted to `caipChainId`', async () => {
    const oldStorage = {
      meta: { version: 88 },
      data: {
        IncomingTransactionsController: {
          incomingTxLastFetchedBlockByChainId: {
            '0x10': null,
            '0x20': 100,
            '0x40': 200,
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual({
      IncomingTransactionsController: {
        incomingTxLastFetchedBlockByChainId: {
          'eip155:16': null,
          'eip155:32': 100,
          'eip155:64': 200,
        },
      },
    });
  });

  it('returns the state unaltered if it has no TransactionController property', async () => {
    const oldData = {
      some: 'data',
    };
    const oldStorage = {
      meta: { version: 88 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('returns the state unaltered if the TransactionController object has no transactions property', async () => {
    const oldData = {
      TransactionController: {
        some: 'data',
      },
    };
    const oldStorage = {
      meta: { version: 88 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('returns the state unaltered if TransactionController.transactions is not an object', async () => {
    const oldData = {
      TransactionController: {
        transactions: 'foo',
      },
    };
    const oldStorage = {
      meta: { version: 88 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  // is it possible for this to be decimal too?
  it('rewrites TransactionController.transactions so that hex chain IDs are converted to caip chain IDs', async () => {
    const oldStorage = {
      meta: { version: 88 },
      data: {
        TransactionController: {
          transactions: {
            '100': {
              id: 100,
              metamaskNetworkId: '5777',
              foo: 'bar',
              other: 'fields',
              chainId: '0x539',
              actionId: 1000,
              history: [
                {
                  id: 100,
                  actionId: 1000,
                  chainId: '0x539',
                  other: 'fields',
                  txParams: {
                    data: 'data',
                    from: '0xee166a3eec4796dec6a1d314e7485a52bbe68e4d',
                    gas: '0x100',
                    value: '0x0',
                  },
                },
                [
                  {
                    note: 'note',
                    op: 'add',
                    path: '/txParams/maxFeePerGas',
                    timestamp: 1,
                    value: '0x1',
                  },
                ],
                [
                  {
                    note: 'note',
                    op: 'add',
                    path: '/estimatedBaseFee',
                    timestamp: 2,
                    value: '3',
                  },
                ],
              ],
            },
            '200': {
              id: 200,
              metamaskNetworkId: '5777',
              foo: 'bar',
              other: 'fields',
              chainId: '0x1',
              actionId: 999,
              history: [
                {
                  actionId: 999,
                  chainId: '0x1',
                  other: 'fields',
                  txParams: {
                    data: 'data',
                    from: '0xee166a3eec4796dec6a1d314e7485a52bbe68e4d',
                    gas: '0x100',
                    value: '0x0',
                  },
                },
                [
                  {
                    note: 'note',
                    op: 'add',
                    path: '/txParams/maxFeePerGas',
                    timestamp: 1,
                    value: '0x1',
                  },
                ],
                [
                  {
                    note: 'note',
                    op: 'add',
                    path: '/estimatedBaseFee',
                    timestamp: 2,
                    value: '3',
                  },
                ],
              ],
            },
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual({
      TransactionController: {
        transactions: {
          '100': {
            id: 100,
            metamaskNetworkId: '5777',
            foo: 'bar',
            other: 'fields',
            caipChainId: 'eip155:1337',
            actionId: 1000,
            history: [
              {
                id: 100,
                actionId: 1000,
                caipChainId: 'eip155:1337',
                other: 'fields',
                txParams: {
                  data: 'data',
                  from: '0xee166a3eec4796dec6a1d314e7485a52bbe68e4d',
                  gas: '0x100',
                  value: '0x0',
                },
              },
              [
                {
                  note: 'note',
                  op: 'add',
                  path: '/txParams/maxFeePerGas',
                  timestamp: 1,
                  value: '0x1',
                },
              ],
              [
                {
                  note: 'note',
                  op: 'add',
                  path: '/estimatedBaseFee',
                  timestamp: 2,
                  value: '3',
                },
              ],
            ],
          },
          '200': {
            id: 200,
            metamaskNetworkId: '5777',
            foo: 'bar',
            other: 'fields',
            caipChainId: 'eip155:1',
            actionId: 999,
            history: [
              {
                actionId: 999,
                caipChainId: 'eip155:1',
                other: 'fields',
                txParams: {
                  data: 'data',
                  from: '0xee166a3eec4796dec6a1d314e7485a52bbe68e4d',
                  gas: '0x100',
                  value: '0x0',
                },
              },
              [
                {
                  note: 'note',
                  op: 'add',
                  path: '/txParams/maxFeePerGas',
                  timestamp: 1,
                  value: '0x1',
                },
              ],
              [
                {
                  note: 'note',
                  op: 'add',
                  path: '/estimatedBaseFee',
                  timestamp: 2,
                  value: '3',
                },
              ],
            ],
          },
        },
      },
    });
  });

  it('returns the state unaltered if it has no TxController property', async () => {
    const oldData = {
      some: 'data',
    };
    const oldStorage = {
      meta: { version: 88 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('returns the state unaltered if the TxController object has no currentNetworkTxList property', async () => {
    const oldData = {
      TxController: {
        some: 'data',
      },
    };
    const oldStorage = {
      meta: { version: 88 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('returns the state unaltered if TxController.currentNetworkTxList is not an array', async () => {
    const oldData = {
      TxController: {
        currentNetworkTxList: {},
      },
    };
    const oldStorage = {
      meta: { version: 88 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  // is it possible for this to be decimal too?
  it('rewrites TxController.currentNetworkTxList so that hex chain IDs are converted to caip chain IDs', async () => {
    const oldStorage = {
      meta: { version: 88 },
      data: {
        TxController: {
          currentNetworkTxList: [
            {
              id: 100,
              metamaskNetworkId: '5777',
              foo: 'bar',
              other: 'fields',
              chainId: '0x539',
              actionId: 1000,
              history: [
                {
                  id: 100,
                  actionId: 1000,
                  chainId: '0x539',
                  other: 'fields',
                  txParams: {
                    data: 'data',
                    from: '0xee166a3eec4796dec6a1d314e7485a52bbe68e4d',
                    gas: '0x100',
                    value: '0x0',
                  },
                },
                [
                  {
                    note: 'note',
                    op: 'add',
                    path: '/txParams/maxFeePerGas',
                    timestamp: 1,
                    value: '0x1',
                  },
                ],
                [
                  {
                    note: 'note',
                    op: 'add',
                    path: '/estimatedBaseFee',
                    timestamp: 2,
                    value: '3',
                  },
                ],
              ],
            },
            {
              id: 200,
              metamaskNetworkId: '5777',
              foo: 'bar',
              other: 'fields',
              chainId: '0x1',
              actionId: 999,
              history: [
                {
                  actionId: 999,
                  chainId: '0x1',
                  other: 'fields',
                  txParams: {
                    data: 'data',
                    from: '0xee166a3eec4796dec6a1d314e7485a52bbe68e4d',
                    gas: '0x100',
                    value: '0x0',
                  },
                },
                [
                  {
                    note: 'note',
                    op: 'add',
                    path: '/txParams/maxFeePerGas',
                    timestamp: 1,
                    value: '0x1',
                  },
                ],
                [
                  {
                    note: 'note',
                    op: 'add',
                    path: '/estimatedBaseFee',
                    timestamp: 2,
                    value: '3',
                  },
                ],
              ],
            },
          ],
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual({
      TxController: {
        currentNetworkTxList: [
          {
            id: 100,
            metamaskNetworkId: '5777',
            foo: 'bar',
            other: 'fields',
            caipChainId: 'eip155:1337',
            actionId: 1000,
            history: [
              {
                id: 100,
                actionId: 1000,
                caipChainId: 'eip155:1337',
                other: 'fields',
                txParams: {
                  data: 'data',
                  from: '0xee166a3eec4796dec6a1d314e7485a52bbe68e4d',
                  gas: '0x100',
                  value: '0x0',
                },
              },
              [
                {
                  note: 'note',
                  op: 'add',
                  path: '/txParams/maxFeePerGas',
                  timestamp: 1,
                  value: '0x1',
                },
              ],
              [
                {
                  note: 'note',
                  op: 'add',
                  path: '/estimatedBaseFee',
                  timestamp: 2,
                  value: '3',
                },
              ],
            ],
          },
          {
            id: 200,
            metamaskNetworkId: '5777',
            foo: 'bar',
            other: 'fields',
            caipChainId: 'eip155:1',
            actionId: 999,
            history: [
              {
                actionId: 999,
                caipChainId: 'eip155:1',
                other: 'fields',
                txParams: {
                  data: 'data',
                  from: '0xee166a3eec4796dec6a1d314e7485a52bbe68e4d',
                  gas: '0x100',
                  value: '0x0',
                },
              },
              [
                {
                  note: 'note',
                  op: 'add',
                  path: '/txParams/maxFeePerGas',
                  timestamp: 1,
                  value: '0x1',
                },
              ],
              [
                {
                  note: 'note',
                  op: 'add',
                  path: '/estimatedBaseFee',
                  timestamp: 2,
                  value: '3',
                },
              ],
            ],
          },
        ],
      },
    });
  });

  it('returns the state unaltered if the TxController object has no unapprovedTxs property', async () => {
    const oldData = {
      TxController: {
        some: 'data',
      },
    };
    const oldStorage = {
      meta: { version: 88 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('returns the state unaltered if TxController.unapprovedTxs is not an object', async () => {
    const oldData = {
      TxController: {
        unapprovedTxs: 'foo',
      },
    };
    const oldStorage = {
      meta: { version: 88 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  // is it possible for this to be decimal too?
  it('rewrites TxController.unapprovedTxs so that hex chain IDs are converted to caip chain IDs', async () => {
    const oldStorage = {
      meta: { version: 88 },
      data: {
        TxController: {
          unapprovedTxs: {
            '100': {
              id: 100,
              metamaskNetworkId: '5777',
              foo: 'bar',
              other: 'fields',
              chainId: '0x539',
              actionId: 1000,
              history: [
                {
                  id: 100,
                  actionId: 1000,
                  chainId: '0x539',
                  other: 'fields',
                  txParams: {
                    data: 'data',
                    from: '0xee166a3eec4796dec6a1d314e7485a52bbe68e4d',
                    gas: '0x100',
                    value: '0x0',
                  },
                },
                [
                  {
                    note: 'note',
                    op: 'add',
                    path: '/txParams/maxFeePerGas',
                    timestamp: 1,
                    value: '0x1',
                  },
                ],
                [
                  {
                    note: 'note',
                    op: 'add',
                    path: '/estimatedBaseFee',
                    timestamp: 2,
                    value: '3',
                  },
                ],
              ],
            },
            '200': {
              id: 200,
              metamaskNetworkId: '5777',
              foo: 'bar',
              other: 'fields',
              chainId: '0x1',
              actionId: 999,
              history: [
                {
                  actionId: 999,
                  chainId: '0x1',
                  other: 'fields',
                  txParams: {
                    data: 'data',
                    from: '0xee166a3eec4796dec6a1d314e7485a52bbe68e4d',
                    gas: '0x100',
                    value: '0x0',
                  },
                },
                [
                  {
                    note: 'note',
                    op: 'add',
                    path: '/txParams/maxFeePerGas',
                    timestamp: 1,
                    value: '0x1',
                  },
                ],
                [
                  {
                    note: 'note',
                    op: 'add',
                    path: '/estimatedBaseFee',
                    timestamp: 2,
                    value: '3',
                  },
                ],
              ],
            },
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual({
      TxController: {
        unapprovedTxs: {
          '100': {
            id: 100,
            metamaskNetworkId: '5777',
            foo: 'bar',
            other: 'fields',
            caipChainId: 'eip155:1337',
            actionId: 1000,
            history: [
              {
                id: 100,
                actionId: 1000,
                caipChainId: 'eip155:1337',
                other: 'fields',
                txParams: {
                  data: 'data',
                  from: '0xee166a3eec4796dec6a1d314e7485a52bbe68e4d',
                  gas: '0x100',
                  value: '0x0',
                },
              },
              [
                {
                  note: 'note',
                  op: 'add',
                  path: '/txParams/maxFeePerGas',
                  timestamp: 1,
                  value: '0x1',
                },
              ],
              [
                {
                  note: 'note',
                  op: 'add',
                  path: '/estimatedBaseFee',
                  timestamp: 2,
                  value: '3',
                },
              ],
            ],
          },
          '200': {
            id: 200,
            metamaskNetworkId: '5777',
            foo: 'bar',
            other: 'fields',
            caipChainId: 'eip155:1',
            actionId: 999,
            history: [
              {
                actionId: 999,
                caipChainId: 'eip155:1',
                other: 'fields',
                txParams: {
                  data: 'data',
                  from: '0xee166a3eec4796dec6a1d314e7485a52bbe68e4d',
                  gas: '0x100',
                  value: '0x0',
                },
              },
              [
                {
                  note: 'note',
                  op: 'add',
                  path: '/txParams/maxFeePerGas',
                  timestamp: 1,
                  value: '0x1',
                },
              ],
              [
                {
                  note: 'note',
                  op: 'add',
                  path: '/estimatedBaseFee',
                  timestamp: 2,
                  value: '3',
                },
              ],
            ],
          },
        },
      },
    });
  });

  it('returns the state unaltered if it has no SmartTransactionsController property', async () => {
    const oldData = {
      some: 'data',
    };
    const oldStorage = {
      meta: { version: 88 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('returns the state unaltered if the SmartTransactionsController object has no smartTransactionsState property', async () => {
    const oldData = {
      SmartTransactionsController: {
        some: 'data',
      },
    };
    const oldStorage = {
      meta: { version: 88 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('returns the state unaltered if SmartTransactionsController.smartTransactionsState is not an object', async () => {
    const oldData = {
      SmartTransactionsController: {
        smartTransactionsState: 'foo',
      },
    };
    const oldStorage = {
      meta: { version: 88 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('returns the state unaltered if the SmartTransactionsController object has no smartTransactionsState.smartTransactions property', async () => {
    const oldData = {
      SmartTransactionsController: {
        smartTransactionsState: {
          some: 'data',
        },
      },
    };
    const oldStorage = {
      meta: { version: 88 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('returns the state unaltered if SmartTransactionsController.smartTransactionsState.smartTransactions is not an object', async () => {
    const oldData = {
      SmartTransactionsController: {
        smartTransactionsState: {
          smartTransactions: 'foo',
        },
      },
    };
    const oldStorage = {
      meta: { version: 88 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('rewrites SmartTransactionsController.smartTransactionsState.smartTransactions so that hex chain IDs are converted to caip chain IDs', async () => {
    const oldStorage = {
      meta: { version: 88 },
      data: {
        SmartTransactionsController: {
          smartTransactionsState: {
            smartTransactions: {
              '0x10': [{ tx: 'foo' }],
              '0x20': [{ tx: 'bar' }],
            },
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual({
      SmartTransactionsController: {
        smartTransactionsState: {
          smartTransactions: {
            'eip155:16': [{ tx: 'foo' }],
            'eip155:32': [{ tx: 'bar' }],
          },
        },
      },
    });
  });
});
