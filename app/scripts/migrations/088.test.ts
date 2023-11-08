import log from 'loglevel';
import { migrate } from './088';

jest.mock('loglevel');

const sentryCaptureExceptionMock = jest.fn();

global.sentry = {
  captureException: sentryCaptureExceptionMock,
};

describe('migration #88', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: 87 },
      data: {},
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta).toStrictEqual({ version: 88 });
  });

  it('returns the state unaltered if it has no NftController property', async () => {
    const oldData = {
      some: 'data',
    };
    const oldStorage = {
      meta: { version: 87 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('captures an exception if the NftController property is not an object', async () => {
    const oldData = {
      TokenListController: {},
      TokensController: {},
      NftController: false,
    };
    const oldStorage = {
      meta: { version: 87 },
      data: oldData,
    };

    await migrate(oldStorage);
    expect(sentryCaptureExceptionMock).toHaveBeenCalledTimes(1);
    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      new Error(`typeof state.NftController is boolean`),
    );
  });

  it('returns the state unaltered if the NftController object has no allNftContracts property', async () => {
    const oldData = {
      NftController: {
        some: 'data',
      },
    };
    const oldStorage = {
      meta: { version: 87 },
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
      meta: { version: 87 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('captures an exception if it NftController.allNftContracts is not an object', async () => {
    const oldData = {
      TokenListController: {},
      TokensController: {},
      NftController: {
        allNftContracts: 'foo',
      },
    };
    const oldStorage = {
      meta: { version: 87 },
      data: oldData,
    };

    await migrate(oldStorage);
    expect(sentryCaptureExceptionMock).toHaveBeenCalledTimes(1);
    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      new Error(`typeof state.NftController.allNftContracts is string`),
    );
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
      meta: { version: 87 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('rewrites NftController.allNftContracts so that decimal chain IDs are converted to hex strings', async () => {
    const oldStorage = {
      meta: { version: 87 },
      data: {
        NftController: {
          allNftContracts: {
            '0x111': {
              '16': [
                {
                  name: 'Contract 1',
                  address: '0xaaa',
                },
              ],
              '32': [
                {
                  name: 'Contract 2',
                  address: '0xbbb',
                },
              ],
            },
            '0x222': {
              '64': [
                {
                  name: 'Contract 3',
                  address: '0xccc',
                },
              ],
              '128': [
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
    });
  });

  it('deletes undefined-keyed properties from state of NftController.allNftContracts', async () => {
    const oldStorage = {
      meta: { version: 87 },
      data: {
        NftController: {
          allNftContracts: {
            '0x111': {
              '16': [
                {
                  name: 'Contract 1',
                  address: '0xaaa',
                },
              ],
              undefined: [
                {
                  name: 'Contract 2',
                  address: '0xbbb',
                },
              ],
            },
            '0x222': {
              '64': [
                {
                  name: 'Contract 3',
                  address: '0xccc',
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
            '0x10': [
              {
                name: 'Contract 1',
                address: '0xaaa',
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
          },
        },
      },
    });
  });

  it('does not convert chain IDs in NftController.allNftContracts which are already hex strings', async () => {
    const oldStorage = {
      meta: { version: 87 },
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
    });
  });

  it('returns the state unaltered if the NftController object has no allNfts property', async () => {
    const oldData = {
      NftController: {
        some: 'data',
      },
    };
    const oldStorage = {
      meta: { version: 87 },
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
      meta: { version: 87 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('captures an exception if it NftController.allNfts is not an object', async () => {
    const oldData = {
      TokenListController: {},
      TokensController: {},
      NftController: {
        allNfts: 'foo',
      },
    };
    const oldStorage = {
      meta: { version: 87 },
      data: oldData,
    };

    await migrate(oldStorage);
    expect(sentryCaptureExceptionMock).toHaveBeenCalledTimes(1);
    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      new Error(`typeof state.NftController.allNfts is string`),
    );
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
      meta: { version: 87 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('rewrites NftController.allNfts so that decimal chain IDs are converted to hex strings', async () => {
    const oldStorage = {
      meta: { version: 87 },
      data: {
        NftController: {
          allNfts: {
            '0x111': {
              '16': [
                {
                  name: 'NFT 1',
                  description: 'Description for NFT 1',
                  image: 'nft1.jpg',
                  standard: 'ERC721',
                  tokenId: '1',
                  address: '0xaaa',
                },
              ],
              '32': [
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
              '64': [
                {
                  name: 'NFT 3',
                  description: 'Description for NFT 3',
                  image: 'nft3.jpg',
                  standard: 'ERC721',
                  tokenId: '3',
                  address: '0xccc',
                },
              ],
              '128': [
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
    });
  });

  it('deletes undefined-keyed properties from state of NftController.allNfts', async () => {
    const oldStorage = {
      meta: { version: 87 },
      data: {
        NftController: {
          allNfts: {
            '0x111': {
              '16': [
                {
                  name: 'NFT 1',
                  description: 'Description for NFT 1',
                  image: 'nft1.jpg',
                  standard: 'ERC721',
                  tokenId: '1',
                  address: '0xaaa',
                },
              ],
              undefined: [
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
              '64': [
                {
                  name: 'NFT 3',
                  description: 'Description for NFT 3',
                  image: 'nft3.jpg',
                  standard: 'ERC721',
                  tokenId: '3',
                  address: '0xccc',
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
          },
        },
      },
    });
  });

  it('does not convert chain IDs in NftController.allNfts which are already hex strings', async () => {
    const oldStorage = {
      meta: { version: 87 },
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
    });
  });

  it('returns the state unaltered if it has no TokenListController property', async () => {
    const oldData = {
      some: 'data',
    };
    const oldStorage = {
      meta: { version: 87 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('logs a warning if it has no TokenListController property', async () => {
    const mockWarnFn = jest.spyOn(log, 'warn');

    const oldData = {
      TokensController: {},
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
          },
        },
        allNftContracts: {
          '0x111': {
            '0x10': [
              {
                name: 'Contract 1',
                address: '0xaaa',
              },
            ],
          },
        },
      },
    };
    const oldStorage = {
      meta: { version: 87 },
      data: oldData,
    };

    await migrate(oldStorage);
    expect(mockWarnFn).toHaveBeenCalledTimes(4);
    expect(mockWarnFn).toHaveBeenNthCalledWith(
      1,
      'typeof state.TokenListController is undefined',
    );
  });

  it('logs a warning if the TokenListController property is not an object', async () => {
    const mockWarnFn = jest.spyOn(log, 'warn');

    const oldData = {
      TokensController: {},
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
          },
        },
        allNftContracts: {
          '0x111': {
            '0x10': [
              {
                name: 'Contract 1',
                address: '0xaaa',
              },
            ],
          },
        },
      },
      TokenListController: false,
    };
    const oldStorage = {
      meta: { version: 87 },
      data: oldData,
    };

    await migrate(oldStorage);
    expect(mockWarnFn).toHaveBeenCalledTimes(4);
    expect(mockWarnFn).toHaveBeenNthCalledWith(
      1,
      'typeof state.TokenListController is boolean',
    );
  });

  it('returns the state unaltered if the TokenListController object has no tokensChainsCache property', async () => {
    const oldData = {
      TokenListController: {
        some: 'data',
      },
    };
    const oldStorage = {
      meta: { version: 87 },
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
      meta: { version: 87 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('captures an exception if the TokenListController.tokensChainsCache property is not an object', async () => {
    const oldData = {
      TokenListController: {
        tokensChainsCache: 'foo',
      },
      TokensController: {},
    };
    const oldStorage = {
      meta: { version: 87 },
      data: oldData,
    };

    await migrate(oldStorage);
    expect(sentryCaptureExceptionMock).toHaveBeenCalledTimes(1);
    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      new Error(`typeof state.TokenListController.tokensChainsCache is string`),
    );
  });

  it('rewrites TokenListController.tokensChainsCache so that decimal chain IDs are converted to hex strings', async () => {
    const oldStorage = {
      meta: { version: 87 },
      data: {
        TokenListController: {
          tokensChainsCache: {
            '16': {
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
            '32': {
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
    });
  });

  it('deletes undefined-keyed properties from state of TokenListController.tokensChainsCache', async () => {
    const oldStorage = {
      meta: { version: 87 },
      data: {
        TokenListController: {
          tokensChainsCache: {
            '16': {
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
            undefined: {
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
        },
      },
    });
  });

  it('does not convert chain IDs in TokenListController.tokensChainsCache which are already hex strings', async () => {
    const oldStorage = {
      meta: { version: 87 },
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
    });
  });

  it('returns the state unaltered if it has no TokensController property', async () => {
    const oldData = {
      some: 'data',
    };
    const oldStorage = {
      meta: { version: 87 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('captures an exception if it has no TokensController property', async () => {
    const oldData = {
      TokenListController: {},
    };
    const oldStorage = {
      meta: { version: 87 },
      data: oldData,
    };

    await migrate(oldStorage);
    expect(sentryCaptureExceptionMock).toHaveBeenCalledTimes(1);
    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      new Error(`typeof state.TokensController is undefined`),
    );
  });

  it('captures an exception if the TokensController property is not an object', async () => {
    const oldData = {
      TokenListController: {},
      TokensController: false,
    };
    const oldStorage = {
      meta: { version: 87 },
      data: oldData,
    };

    await migrate(oldStorage);
    expect(sentryCaptureExceptionMock).toHaveBeenCalledTimes(1);
    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      new Error(`typeof state.TokensController is boolean`),
    );
  });

  it('returns the state unaltered if the TokensController object has no allTokens property', async () => {
    const oldData = {
      TokensController: {
        some: 'data',
      },
    };
    const oldStorage = {
      meta: { version: 87 },
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
      meta: { version: 87 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('captures an exception if the TokensController.allTokens property is not an object', async () => {
    const oldData = {
      TokenListController: {},
      TokensController: {
        allTokens: 'foo',
      },
    };
    const oldStorage = {
      meta: { version: 87 },
      data: oldData,
    };

    await migrate(oldStorage);
    expect(sentryCaptureExceptionMock).toHaveBeenCalledTimes(1);
    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      new Error(`typeof state.TokensController.allTokens is string`),
    );
  });

  it('rewrites TokensController.allTokens so that decimal chain IDs are converted to hex strings', async () => {
    const oldStorage = {
      meta: { version: 87 },
      data: {
        TokensController: {
          allTokens: {
            '16': {
              '0x111': [
                {
                  address: '0xaaa',
                  decimals: 1,
                  symbol: 'TEST1',
                },
              ],
            },
            '32': {
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
    });
  });

  it('deletes undefined keyed properties from TokensController.allTokens', async () => {
    const oldStorage = {
      meta: { version: 87 },
      data: {
        TokensController: {
          allTokens: {
            '16': {
              '0x111': [
                {
                  address: '0xaaa',
                  decimals: 1,
                  symbol: 'TEST1',
                },
              ],
            },
            '32': {
              '0x222': [
                {
                  address: '0xbbb',
                  decimals: 1,
                  symbol: 'TEST2',
                },
              ],
            },
            undefined: {
              '0x333': [
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
    });
  });

  it('does not convert chain IDs in TokensController.allTokens which are already hex strings', async () => {
    const oldStorage = {
      meta: { version: 87 },
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
    });
  });

  it('returns the state unaltered if the TokensController object has no allIgnoredTokens property', async () => {
    const oldData = {
      TokensController: {
        some: 'data',
      },
    };
    const oldStorage = {
      meta: { version: 87 },
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
      meta: { version: 87 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('captures an exception if the TokensController.allIgnoredTokens property is not an object', async () => {
    const oldData = {
      TokenListController: {},
      TokensController: {
        allIgnoredTokens: 'foo',
      },
    };
    const oldStorage = {
      meta: { version: 87 },
      data: oldData,
    };

    await migrate(oldStorage);
    expect(sentryCaptureExceptionMock).toHaveBeenCalledTimes(1);
    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      new Error(`typeof state.TokensController.allIgnoredTokens is string`),
    );
  });

  it('rewrites TokensController.allIgnoredTokens so that decimal chain IDs are converted to hex strings', async () => {
    const oldStorage = {
      meta: { version: 87 },
      data: {
        TokensController: {
          allIgnoredTokens: {
            '16': {
              '0x1': {
                '0x111': ['0xaaa'],
              },
            },
            '32': {
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
    });
  });

  it('deletes undefined-keyed properties from TokensController.allIgnoredTokens', async () => {
    const oldStorage = {
      meta: { version: 87 },
      data: {
        TokensController: {
          allIgnoredTokens: {
            '16': {
              '0x1': {
                '0x111': ['0xaaa'],
              },
            },
            '32': {
              '0x2': {
                '0x222': ['0xbbb'],
              },
            },
            undefined: {
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
    });
  });

  it('does not convert chain IDs in TokensController.allIgnoredTokens which are already hex strings', async () => {
    const oldStorage = {
      meta: { version: 87 },
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
    });
  });

  it('returns the state unaltered if the TokensController object has no allDetectedTokens property', async () => {
    const oldData = {
      TokensController: {
        some: 'data',
      },
    };
    const oldStorage = {
      meta: { version: 87 },
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
      meta: { version: 87 },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('captures an exception if the TokensController.allDetectedTokens property is not an object', async () => {
    const oldData = {
      TokenListController: {},
      TokensController: {
        allDetectedTokens: 'foo',
      },
    };
    const oldStorage = {
      meta: { version: 87 },
      data: oldData,
    };

    await migrate(oldStorage);
    expect(sentryCaptureExceptionMock).toHaveBeenCalledTimes(1);
    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      new Error(`typeof state.TokensController.allDetectedTokens is string`),
    );
  });

  it('rewrites TokensController.allDetectedTokens so that decimal chain IDs are converted to hex strings', async () => {
    const oldStorage = {
      meta: { version: 87 },
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
    });
  });

  it('deletes undefined-keyed properties from  TokensController.allDetectedTokens', async () => {
    const oldStorage = {
      meta: { version: 87 },
      data: {
        TokensController: {
          allDetectedTokens: {
            '16': {
              '0x1': {
                '0x111': ['0xaaa'],
              },
            },
            undefined: {
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
          '0x10': {
            '0x1': {
              '0x111': ['0xaaa'],
            },
          },
        },
      },
    });
  });

  it('does not convert chain IDs in TokensController.allDetectedTokens which are already hex strings', async () => {
    const oldStorage = {
      meta: { version: 87 },
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
    });
  });
});
