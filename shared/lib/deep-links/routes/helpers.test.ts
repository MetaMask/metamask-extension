import { parseAssetID } from './helpers';

describe('parseAssetID', () => {
  describe('valid cases', () => {
    it('parses minimal lengths without tokenId', () => {
      const input = 'abc:a/bcd:efg';
      const result = parseAssetID(input);
      expect(result).toStrictEqual({
        chainId: { id: 'abc:a', namespace: 'abc', blockchainId: 'a' },
        assetNamespace: 'bcd',
        assetReference: 'efg',
        assetType: 'abc:a/bcd:efg',
        tokenId: undefined,
        assetId: undefined,
      });
    });

    it('parses maximal lengths without tokenId', () => {
      const namespace = 'abcdefgh';
      const blockchainId = 'abcdefghijklmnopqrstuvwxyz012345';
      const assetNamespace = 'ijklmnop';
      const assetReference = 'a'.repeat(128);
      const input = `${namespace}:${blockchainId}/${assetNamespace}:${assetReference}`;
      const result = parseAssetID(input);
      expect(result).toStrictEqual({
        chainId: {
          id: `${namespace}:${blockchainId}`,
          namespace,
          blockchainId,
        },
        assetNamespace,
        assetReference,
        assetType: `${namespace}:${blockchainId}/${assetNamespace}:${assetReference}`,
        tokenId: undefined,
        assetId: undefined,
      });
    });

    it('parses minimal lengths with tokenId', () => {
      const input = 'abc:a/bcd:efg/h';
      const result = parseAssetID(input);
      expect(result).toStrictEqual({
        chainId: { id: 'abc:a', namespace: 'abc', blockchainId: 'a' },
        assetNamespace: 'bcd',
        assetReference: 'efg',
        assetType: 'abc:a/bcd:efg',
        tokenId: 'h',
        assetId: 'abc:a/bcd:efg/h',
      });
    });

    it('parses maximal lengths with tokenId', () => {
      const namespace = 'abcdefgh';
      const blockchainId = 'abcdefghijklmnopqrstuvwxyz012345';
      const assetNamespace = 'ijklmnop';
      const assetReference = 'a'.repeat(128);
      const tokenId = 'a'.repeat(78);
      const input = `${namespace}:${blockchainId}/${assetNamespace}:${assetReference}/${tokenId}`;
      const result = parseAssetID(input);
      expect(result).toStrictEqual({
        chainId: {
          id: `${namespace}:${blockchainId}`,
          namespace,
          blockchainId,
        },
        assetNamespace,
        assetReference,
        assetType: `${namespace}:${blockchainId}/${assetNamespace}:${assetReference}`,
        tokenId,
        assetId: `${namespace}:${blockchainId}/${assetNamespace}:${assetReference}/${tokenId}`,
      });
    });

    it('parses typical Ethereum example without tokenId', () => {
      const input = 'eip155:1/erc20:0x1234567890abcdef1234567890abcdef12345678';
      const result = parseAssetID(input);
      expect(result).toStrictEqual({
        chainId: { id: 'eip155:1', namespace: 'eip155', blockchainId: '1' },
        assetNamespace: 'erc20',
        assetReference: '0x1234567890abcdef1234567890abcdef12345678',
        assetType: 'eip155:1/erc20:0x1234567890abcdef1234567890abcdef12345678',
        tokenId: undefined,
        assetId: undefined,
      });
    });

    it('parses typical Ethereum example with tokenId', () => {
      const input =
        'eip155:1/erc721:0x1234567890abcdef1234567890abcdef12345678/42';
      const result = parseAssetID(input);
      expect(result).toStrictEqual({
        chainId: { id: 'eip155:1', namespace: 'eip155', blockchainId: '1' },
        assetNamespace: 'erc721',
        assetReference: '0x1234567890abcdef1234567890abcdef12345678',
        assetType: 'eip155:1/erc721:0x1234567890abcdef1234567890abcdef12345678',
        tokenId: '42',
        assetId:
          'eip155:1/erc721:0x1234567890abcdef1234567890abcdef12345678/42',
      });
    });

    it('parses with special characters in assetReference', () => {
      const input = 'eip155:1/erc20:0x123.456%789';
      const result = parseAssetID(input);
      expect(result).toStrictEqual({
        chainId: { id: 'eip155:1', namespace: 'eip155', blockchainId: '1' },
        assetNamespace: 'erc20',
        assetReference: '0x123.456%789',
        assetType: 'eip155:1/erc20:0x123.456%789',
        tokenId: undefined,
        assetId: undefined,
      });
    });

    it('parses with hyphens in namespace and assetNamespace', () => {
      const input = 'eip-155:1/erc-20:0x123';
      const result = parseAssetID(input);
      expect(result).toStrictEqual({
        chainId: { id: 'eip-155:1', namespace: 'eip-155', blockchainId: '1' },
        assetNamespace: 'erc-20',
        assetReference: '0x123',
        assetType: 'eip-155:1/erc-20:0x123',
        tokenId: undefined,
        assetId: undefined,
      });
    });

    it('allows uppercase in blockchainId', () => {
      const input = 'eip155:Mainnet/erc20:0x123';
      const result = parseAssetID(input);
      expect(result).toStrictEqual({
        chainId: {
          id: 'eip155:Mainnet',
          namespace: 'eip155',
          blockchainId: 'Mainnet',
        },
        assetNamespace: 'erc20',
        assetReference: '0x123',
        assetType: 'eip155:Mainnet/erc20:0x123',
        tokenId: undefined,
        assetId: undefined,
      });
    });

    it('parses ERC-20 token with tokenId', () => {
      const input = 'eip155:1/erc20:0x123/extra';
      const result = parseAssetID(input);
      expect(result).toStrictEqual({
        chainId: { id: 'eip155:1', namespace: 'eip155', blockchainId: '1' },
        assetNamespace: 'erc20',
        assetReference: '0x123',
        assetType: 'eip155:1/erc20:0x123',
        tokenId: 'extra',
        assetId: 'eip155:1/erc20:0x123/extra',
      });
    });
  });

  describe('invalid cases', () => {
    const invalidInputs = [
      'eip1551/erc20:0x123', // Missing ':' in chainId
      'eip155:1erc20:0x123', // Missing '/' between chainId and assetDef
      'eip155:1/erc200x123', // Missing ':' in assetDef
      'eip155:1//erc20:0x123', // Extra '/'
      'eip155:1/erc20::0x123', // Extra ':'
      'eip155:1/erc20:0x123/', // Trailing '/'
      '/eip155:1/erc20:0x123', // Leading '/'
      'eip155:1', // Missing assetDef
      'EIP155:1/erc20:0x123', // Uppercase in namespace
      'eip155:1/ERC20:0x123', // Uppercase in assetNamespace
      'eip155:1/erc20:0x123!', // Invalid character in assetReference
      'eip155:1/erc721:0x123/42!', // Invalid character in tokenId
      'ab:a/bcd:efg', // Namespace too short
      'abcdefghi:a/bcd:efg', // Namespace too long
      `eip155:${'a'.repeat(33)}/bcd:efg`, // BlockchainId too long
      'eip155:1/bc:efg', // AssetNamespace too short
      'eip155:1/abcdefghi:efg', // AssetNamespace too long
      'eip155:1/bcd:', // AssetReference too short (empty)
      `eip155:1/bcd:${'a'.repeat(129)}`, // AssetReference too long
      'eip155:1/bcd:efg/', // TokenId too short (empty)
      `eip155:1/bcd:efg/${'a'.repeat(79)}`, // TokenId too long
      ':eip155:1/erc20:0x123', // Leading ':'
      'eip155:1/erc20:0x123:', // AssetReference with invalid character
      'eip155:1/erc20:0x123/42/43', // Multiple tokenIds
      '', // Empty string
      ':', // Only delimiters
      '/', // Only delimiters
      ':/', // Only delimiters
      'eip155:1 /erc20:0x123', // Space in input
      ' eip155:1/erc20:0x123 ', // Leading and trailing spaces
      'eip155:1/erc20:0x123\u{1F600}', // Unicode character in assetReference
    ];

    invalidInputs.forEach((input) => {
      it(`returns null for invalid input: ${input}`, () => {
        expect(parseAssetID(input)).toBeNull();
      });
    });
  });
});
