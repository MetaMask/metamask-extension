import { getNftImage, getNftImageAlt, nftTruncateAltText } from './nfts';

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

  describe('getNftImage', () => {
    it('returns original image if string', () => {
      const image =
        'ipfs://bafybeidgklvljyifilhtrxzh77brgnhcy6s2wxoxqc2l73zr2nxlwuxfcy';
      const result = getNftImage(image);
      expect(result).toBe(image);
    });

    it('returns the first image if image is an array', () => {
      const image = [
        'ipfs://bafybeidgklvljyifilhtrxzh77brgnhcy6s2wxoxqc2l73zr2nxlwuxfcy',
        'ipfs://bafybeic26kitpujb3q5h5w7yovmvgmtxl3y4ldsb2pfgual5jq62emsmxq',
      ];
      const result = getNftImage(image);
      expect(result).toBe(image[0]);
    });

    it('returns undefined if image is missing', () => {
      const image = undefined;
      const result = getNftImage(image);
      expect(result).toBeUndefined();
    });

    it('returns undefined if image is not a type we were expecting ', () => {
      const image = { badType: 'badType' } as unknown as string;
      const result = getNftImage(image);
      expect(result).toBeUndefined();
    });
  });
});
