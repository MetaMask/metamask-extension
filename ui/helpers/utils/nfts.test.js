import { getNftImageAlt, nftTruncateAltText } from './nfts';

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

    it('returns an empty string when no name, tokenId, or description is provided', () => {
      expect(
        getNftImageAlt({
          name: null,
          tokenId: null,
          description: null,
        }),
      ).toBe('');
      expect(getNftImageAlt({})).toBe('');
    });
  });

  describe('nftTruncateAltText', () => {
    it('returns the full text if it is shorter than or equal to maxLength', () => {
      expect(nftTruncateAltText('Short text', 20)).toBe('Short text');
    });

    it('truncates the text and adds ellipsis if it is longer than maxLength', () => {
      expect(
        nftTruncateAltText('This is a long text that needs truncation', 20),
      ).toBe('This is a long text...');
    });

    it('truncates at the last space within maxLength if possible', () => {
      expect(
        nftTruncateAltText('This is a long text that needs truncation', 25),
      ).toBe('This is a long text that...');
    });

    it('truncates without cutting words if possible', () => {
      expect(
        nftTruncateAltText('This is a long text that needs truncation', 10),
      ).toBe('This is a...');
    });
  });
});
