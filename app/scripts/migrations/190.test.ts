import { migrate } from './190';

const expectedVersion = 190;
const previousVersion = 189;

describe(`migration #${expectedVersion}`, () => {
  it('updates the version number', async () => {
    const oldVersionedData = {
      meta: { version: previousVersion },
      data: {},
    };
    const changedControllers = new Set<string>();

    await migrate(oldVersionedData, changedControllers);

    expect(oldVersionedData.meta.version).toBe(expectedVersion);
  });

  it('does nothing if state has no NftController property', async () => {
    const oldVersionedData = {
      meta: { version: previousVersion },
      data: {},
    };
    const expectedVersionedData = {
      meta: { version: expectedVersion },
      data: oldVersionedData.data,
    };
    const changedControllers = new Set<string>();

    await migrate(oldVersionedData, changedControllers);

    expect(oldVersionedData).toStrictEqual(expectedVersionedData);
    expect(changedControllers.size).toBe(0);
  });

  it('does nothing if state.NftController is not an object', async () => {
    const oldVersionedData = {
      meta: { version: previousVersion },
      data: {
        NftController: 'not-an-object',
      },
    };
    const expectedVersionedData = {
      meta: { version: expectedVersion },
      data: oldVersionedData.data,
    };
    const changedControllers = new Set<string>();

    await migrate(oldVersionedData, changedControllers);

    expect(oldVersionedData).toStrictEqual(expectedVersionedData);
    expect(changedControllers.size).toBe(0);
  });

  it('does nothing if state.NftController has no allNfts property', async () => {
    const oldVersionedData = {
      meta: { version: previousVersion },
      data: {
        NftController: {},
      },
    };
    const expectedVersionedData = {
      meta: { version: expectedVersion },
      data: oldVersionedData.data,
    };
    const changedControllers = new Set<string>();

    await migrate(oldVersionedData, changedControllers);

    expect(oldVersionedData).toStrictEqual(expectedVersionedData);
    expect(changedControllers.size).toBe(0);
  });

  it('does nothing if state.NftController.allNfts is not an object', async () => {
    const oldVersionedData = {
      meta: { version: previousVersion },
      data: {
        NftController: {
          allNfts: 'not-an-object',
        },
      },
    };
    const expectedVersionedData = {
      meta: { version: expectedVersion },
      data: oldVersionedData.data,
    };
    const changedControllers = new Set<string>();

    await migrate(oldVersionedData, changedControllers);

    expect(oldVersionedData).toStrictEqual(expectedVersionedData);
    expect(changedControllers.size).toBe(0);
  });

  it('does nothing if state.NftController.allNfts is an empty object', async () => {
    const oldVersionedData = {
      meta: { version: previousVersion },
      data: {
        NftController: {
          allNfts: {},
        },
      },
    };
    const expectedVersionedData = {
      meta: { version: expectedVersion },
      data: oldVersionedData.data,
    };
    const changedControllers = new Set<string>();

    await migrate(oldVersionedData, changedControllers);

    expect(oldVersionedData).toStrictEqual(expectedVersionedData);
    expect(changedControllers.size).toBe(0);
  });

  it('preserves NFTs that already have valid chainId', async () => {
    const testNft = {
      address: '0xd41AC77E0813e3FCeeA5FAA3A4944C75f682cBB7',
      chainId: 1,
      description: 'A valid NFT',
      favorite: false,
      image: 'ipfs://QmWpFDcx2sjCxQUEnAny2JCY38pbjxbzzfnVNYG3eZfBUL',
      isCurrentlyOwned: true,
      name: 'Test NFT',
      standard: 'ERC721',
      tokenId: '232',
      tokenURI: 'https://example.com/token/232',
    };

    const oldVersionedData = {
      meta: { version: previousVersion },
      data: {
        NftController: {
          allNfts: {
            '0xacc1': {
              '0x1': [testNft],
            },
          },
        },
      },
    };

    const expectedVersionedData = {
      meta: { version: expectedVersion },
      data: {
        NftController: {
          allNfts: {
            '0xacc1': {
              '0x1': [testNft],
            },
          },
        },
      },
    };
    const changedControllers = new Set<string>();

    await migrate(oldVersionedData, changedControllers);

    expect(oldVersionedData).toStrictEqual(expectedVersionedData);
    expect(changedControllers.size).toBe(0);
  });

  it('adds chainId to NFT objects that are missing it', async () => {
    const testNftWithoutChainId = {
      address: '0xtest1',
      description: 'description',
      favorite: false,
      image: 'image',
      isCurrentlyOwned: true,
      name: 'name',
      standard: 'ERC721',
      tokenId: '232',
      tokenURI: 'tokenURI',
    };

    const oldVersionedData = {
      meta: { version: previousVersion },
      data: {
        NftController: {
          allNfts: {
            '0xacc1': {
              '0x1': [testNftWithoutChainId],
            },
            '0xacc2': {
              '0x89': [{ ...testNftWithoutChainId, address: '0xtest2' }],
            },
          },
        },
      },
    };

    const expectedVersionedData = {
      meta: { version: expectedVersion },
      data: {
        NftController: {
          allNfts: {
            '0xacc1': {
              '0x1': [{ ...testNftWithoutChainId, chainId: 1 }],
            },
            '0xacc2': {
              '0x89': [
                { ...testNftWithoutChainId, address: '0xtest2', chainId: 137 },
              ],
            },
          },
        },
      },
    };
    const changedControllers = new Set<string>();

    await migrate(oldVersionedData, changedControllers);

    expect(oldVersionedData).toStrictEqual(expectedVersionedData);
    expect(changedControllers.has('NftController')).toBe(true);
  });

  it('fixes NFT objects with null chainId', async () => {
    const testNftWithNullChainId = {
      address: '0xtest1',
      chainId: null,
      description: 'description',
      favorite: false,
      image: 'image',
      isCurrentlyOwned: true,
      name: 'name',
      standard: 'ERC721',
      tokenId: '232',
      tokenURI: 'tokenURI',
    };

    const oldVersionedData = {
      meta: { version: previousVersion },
      data: {
        NftController: {
          allNfts: {
            '0xacc1': {
              '0x1': [testNftWithNullChainId],
            },
          },
        },
      },
    };

    const expectedVersionedData = {
      meta: { version: expectedVersion },
      data: {
        NftController: {
          allNfts: {
            '0xacc1': {
              '0x1': [{ ...testNftWithNullChainId, chainId: 1 }],
            },
          },
        },
      },
    };
    const changedControllers = new Set<string>();

    await migrate(oldVersionedData, changedControllers);

    expect(oldVersionedData).toStrictEqual(expectedVersionedData);
    expect(changedControllers.has('NftController')).toBe(true);
  });

  it('fixes NFT objects with undefined chainId', async () => {
    const testNftWithUndefinedChainId = {
      address: '0xtest1',
      chainId: undefined,
      description: 'description',
      favorite: false,
      image: 'image',
      isCurrentlyOwned: true,
      name: 'name',
      standard: 'ERC721',
      tokenId: '232',
      tokenURI: 'tokenURI',
    };

    const oldVersionedData = {
      meta: { version: previousVersion },
      data: {
        NftController: {
          allNfts: {
            '0xacc1': {
              '0x1': [testNftWithUndefinedChainId],
            },
          },
        },
      },
    };

    const expectedVersionedData = {
      meta: { version: expectedVersion },
      data: {
        NftController: {
          allNfts: {
            '0xacc1': {
              '0x1': [
                {
                  address: '0xtest1',
                  chainId: 1,
                  description: 'description',
                  favorite: false,
                  image: 'image',
                  isCurrentlyOwned: true,
                  name: 'name',
                  standard: 'ERC721',
                  tokenId: '232',
                  tokenURI: 'tokenURI',
                },
              ],
            },
          },
        },
      },
    };
    const changedControllers = new Set<string>();

    await migrate(oldVersionedData, changedControllers);

    expect(oldVersionedData).toStrictEqual(expectedVersionedData);
    expect(changedControllers.has('NftController')).toBe(true);
  });

  it('removes null NFT objects from arrays', async () => {
    const validNft = {
      address: '0xtest1',
      chainId: 1,
      description: 'description',
      favorite: false,
      image: 'image',
      isCurrentlyOwned: true,
      name: 'name',
      standard: 'ERC721',
      tokenId: '232',
      tokenURI: 'tokenURI',
    };

    const oldVersionedData = {
      meta: { version: previousVersion },
      data: {
        NftController: {
          allNfts: {
            '0xacc1': {
              '0x1': [validNft, null, undefined],
            },
          },
        },
      },
    };

    const expectedVersionedData = {
      meta: { version: expectedVersion },
      data: {
        NftController: {
          allNfts: {
            '0xacc1': {
              '0x1': [validNft],
            },
          },
        },
      },
    };
    const changedControllers = new Set<string>();

    await migrate(oldVersionedData, changedControllers);

    expect(oldVersionedData).toStrictEqual(expectedVersionedData);
    expect(changedControllers.has('NftController')).toBe(true);
  });

  it('handles mixed valid and invalid NFTs', async () => {
    const validNft1 = {
      address: '0xtest1',
      chainId: 1,
      description: 'Valid NFT 1',
      favorite: false,
      image: 'image1',
      isCurrentlyOwned: true,
      name: 'Valid 1',
      standard: 'ERC721',
      tokenId: '1',
      tokenURI: 'tokenURI1',
    };

    const nftWithoutChainId = {
      address: '0xtest2',
      description: 'Missing chainId',
      favorite: false,
      image: 'image2',
      isCurrentlyOwned: true,
      name: 'Missing ChainId',
      standard: 'ERC721',
      tokenId: '2',
      tokenURI: 'tokenURI2',
    };

    const oldVersionedData = {
      meta: { version: previousVersion },
      data: {
        NftController: {
          allNfts: {
            '0xacc1': {
              '0x1': [validNft1, null, nftWithoutChainId, undefined],
            },
          },
        },
      },
    };

    const expectedVersionedData = {
      meta: { version: expectedVersion },
      data: {
        NftController: {
          allNfts: {
            '0xacc1': {
              '0x1': [validNft1, { ...nftWithoutChainId, chainId: 1 }],
            },
          },
        },
      },
    };
    const changedControllers = new Set<string>();

    await migrate(oldVersionedData, changedControllers);

    expect(oldVersionedData).toStrictEqual(expectedVersionedData);
    expect(changedControllers.has('NftController')).toBe(true);
  });

  it('handles invalid chainId hex strings gracefully', async () => {
    const testNft = {
      address: '0xtest1',
      description: 'description',
      favorite: false,
      image: 'image',
      isCurrentlyOwned: true,
      name: 'name',
      standard: 'ERC721',
      tokenId: '232',
      tokenURI: 'tokenURI',
    };

    const oldVersionedData = {
      meta: { version: previousVersion },
      data: {
        NftController: {
          allNfts: {
            '0xacc1': {
              'invalid-hex': [testNft],
              '0x1': [testNft],
            },
          },
        },
      },
    };

    const expectedVersionedData = {
      meta: { version: expectedVersion },
      data: {
        NftController: {
          allNfts: {
            '0xacc1': {
              // invalid-hex entries should be skipped
              'invalid-hex': [testNft],
              '0x1': [{ ...testNft, chainId: 1 }],
            },
          },
        },
      },
    };
    const changedControllers = new Set<string>();

    await migrate(oldVersionedData, changedControllers);

    expect(oldVersionedData).toStrictEqual(expectedVersionedData);
    expect(changedControllers.has('NftController')).toBe(true);
  });

  it('handles multiple accounts and chain IDs', async () => {
    const nftWithoutChainId = {
      address: '0xtest',
      description: 'description',
      favorite: false,
      image: 'image',
      isCurrentlyOwned: true,
      name: 'name',
      standard: 'ERC721',
      tokenId: '1',
      tokenURI: 'tokenURI',
    };

    const oldVersionedData = {
      meta: { version: previousVersion },
      data: {
        NftController: {
          allNfts: {
            '0xacc1': {
              '0x1': [{ ...nftWithoutChainId, tokenId: '1' }],
              '0x89': [{ ...nftWithoutChainId, tokenId: '2' }],
            },
            '0xacc2': {
              '0x1': [{ ...nftWithoutChainId, tokenId: '3' }],
              '0xa': [{ ...nftWithoutChainId, tokenId: '4' }],
            },
          },
        },
      },
    };

    const expectedVersionedData = {
      meta: { version: expectedVersion },
      data: {
        NftController: {
          allNfts: {
            '0xacc1': {
              '0x1': [{ ...nftWithoutChainId, tokenId: '1', chainId: 1 }],
              '0x89': [{ ...nftWithoutChainId, tokenId: '2', chainId: 137 }],
            },
            '0xacc2': {
              '0x1': [{ ...nftWithoutChainId, tokenId: '3', chainId: 1 }],
              '0xa': [{ ...nftWithoutChainId, tokenId: '4', chainId: 10 }],
            },
          },
        },
      },
    };
    const changedControllers = new Set<string>();

    await migrate(oldVersionedData, changedControllers);

    expect(oldVersionedData).toStrictEqual(expectedVersionedData);
    expect(changedControllers.has('NftController')).toBe(true);
  });
});
