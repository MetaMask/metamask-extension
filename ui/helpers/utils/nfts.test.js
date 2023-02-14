import { getNftImageAlt } from './nfts';

describe('NFTs Utils', () => {
  describe('getNftImageAlt', () => {
    it('returns the description attribute when it is available', () => {
      expect(
        getNftImageAlt({
          name: 'Cool NFT',
          tokenId: '555',
          description: 'This is a really cool NFT',
        }),
      ).toBe('This is a really cool NFT');
    });

    it('returns the formatted name and tokenId attributes when a description is not present', () => {
      expect(
        getNftImageAlt({
          name: 'Cool NFT',
          tokenId: '555',
          description: null,
        }),
      ).toBe('Cool NFT 555');
      expect(
        getNftImageAlt({
          name: 'Cool NFT',
          tokenId: '555',
        }),
      ).toBe('Cool NFT 555');
    });
  });
});
