import { migrate } from './156';

const expectedVersion = 156;
const previousVersion = 155;

describe(`migration #${expectedVersion}`, () => {
  it('does nothing if state has no NftController property', async () => {
    const oldVersionedData = {
      meta: { version: previousVersion },
      data: {},
    };
    const expectedVersionedData = {
      meta: { version: expectedVersion },
      data: oldVersionedData.data,
    };

    const newVersionedData = await migrate(oldVersionedData);

    expect(newVersionedData).toStrictEqual(expectedVersionedData);
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

    const newVersionedData = await migrate(oldVersionedData);

    expect(newVersionedData).toStrictEqual(expectedVersionedData);
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

    const newVersionedData = await migrate(oldVersionedData);

    expect(newVersionedData).toStrictEqual(expectedVersionedData);
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

    const newVersionedData = await migrate(oldVersionedData);

    expect(newVersionedData).toStrictEqual(expectedVersionedData);
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

    const newVersionedData = await migrate(oldVersionedData);

    expect(newVersionedData).toStrictEqual(expectedVersionedData);
  });

  it('does nothing if allNfts already have a chainId', async () => {
    const oldVersionedData = {
      meta: { version: previousVersion },
      data: {
        NftController: {
          allNfts: {
            '0xacc1': {
              Ox1: [
                {
                  chainId: 1,
                  address: '0xd41AC77E0813e3FCeeA5FAA3A4944C75f682cBB7',
                  description:
                    "Website: https://fashionfemaleape.club Users who have obtained Fashion Female APE Blind Box can log in to our official website to open the Blind Box to obtain NFT. Holders of Fashion Girl NFT can receive airdrop tokens. We randomly give random airdrops to lucky users who have interacted with opensea. Please don't worry, we are a legitimate project.",
                  favorite: false,
                  image:
                    'ipfs://QmWpFDcx2sjCxQUEnAny2JCY38pbjxbzzfnVNYG3eZfBUL',
                  isCurrentlyOwned: true,
                  name: 'Fashion Female APE Blinds',
                  standard: 'ERC721',
                  tokenId: '232',
                  tokenURI:
                    'https://bafybeibfre3mfqatadvcvasspnk2ubg5pcdni7ltoa2gjnwpo3lxohsoge.ipfs.dweb.link',
                },
              ],
            },
            Oxacc2: {
              '0x1': [],
            },
          },
        },
      },
    };
    const expectedVersionedData = {
      meta: { version: expectedVersion },
      data: oldVersionedData.data,
    };

    const newVersionedData = await migrate(oldVersionedData);

    expect(newVersionedData).toStrictEqual(expectedVersionedData);
  });

  it('adds a chainId to the Nft object', async () => {
    const testNft1 = {
      address: 'Oxtest1',
      description: 'description',
      favorite: false,
      image: 'image',
      isCurrentlyOwned: true,
      name: 'name',
      standard: 'ERC721',
      tokenId: '232',
      tokenURI: 'tokenURI',
    };
    const testNft2 = {
      address: 'Oxtest2',
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
              '0x1': [testNft1],
            },
            '0xacc2': {
              '0x89': [testNft2],
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
            '0xacc1': { '0x1': [{ ...testNft1, chainId: 1 }] },
            '0xacc2': { '0x89': [{ ...testNft2, chainId: 137 }] },
          },
        },
      },
    };
    const newVersionedData = await migrate(oldVersionedData);

    expect(newVersionedData).toStrictEqual(expectedVersionedData);
  });
});
