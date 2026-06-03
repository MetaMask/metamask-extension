import { Hex } from '@metamask/utils';
import { processAssetParams } from './asset';

describe('processAssetParams', () => {
  describe('non-EVM (CAIP) routes', () => {
    const solanaChainId = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp' as const;
    const solanaTokenRef =
      'token:3iQL8BFS2vE7mww4ehAqQHAsbmRNCrPxizWAT2Zfyr9y' as const;
    const solanaAssetId = `${solanaChainId}/${solanaTokenRef}` as const;

    const testCases = [
      {
        // Firefox decodes `%2F` in window.location.hash before react-router
        // parses the path, so the single CAIP asset id is split into separate
        // params and must be rejoined.
        name: 'rejoins a CAIP asset id split across the asset and id params',
        params: {
          chainId: solanaChainId,
          asset: solanaChainId,
          id: solanaTokenRef,
        },
        expected: {
          decodedAsset: solanaAssetId,
          chainId: solanaChainId,
          asset: solanaChainId,
          id: solanaTokenRef,
        },
      },
      {
        // Chromium browsers leave `%2F` encoded, so the asset id is not split
        // and the id param is undefined.
        name: 'keeps the full CAIP asset id when it arrives in a single asset param',
        params: {
          chainId: solanaChainId,
          asset: solanaAssetId,
          id: undefined,
        },
        expected: { decodedAsset: solanaAssetId },
      },
      {
        name: 'does not rejoin when a CAIP chain has no id param',
        params: {
          chainId: solanaChainId,
          asset: solanaChainId,
          id: undefined,
        },
        expected: { decodedAsset: solanaChainId },
      },
    ];

    // @ts-expect-error This function is missing from the Mocha type definitions
    it.each(testCases)(
      '$name',
      ({ params, expected }: (typeof testCases)[number]) => {
        expect(processAssetParams(params)).toMatchObject(expected);
      },
    );
  });

  describe('EVM (hex) routes', () => {
    const tokenAddress = '0xacA92E438df0B2401fF60dA7E4337B687a2435DA' as const;
    const chainId = '0x1' as const;

    const testCases = [
      {
        // Address casing must be preserved (no lowercasing) and never rejoined.
        name: 'resolves an ERC-20 token route (/asset/0x1/0xaddress)',
        params: { chainId, asset: tokenAddress, id: undefined },
        expected: {
          decodedAsset: tokenAddress,
          chainId,
          id: undefined,
        },
      },
      {
        name: 'resolves a native asset route with no asset param (/asset/0x1)',
        params: { chainId },
        expected: { decodedAsset: undefined, chainId },
      },
      {
        // EVM NFTs legitimately use separate contract address and tokenId
        // params, which must not be merged into a single asset id.
        name: 'does not rejoin NFT routes that use a contract address and tokenId',
        params: { chainId, asset: tokenAddress, id: '123' },
        expected: { decodedAsset: tokenAddress, id: '123' },
      },
      {
        name: 'decodes percent-encoded characters in the asset param',
        params: { chainId, asset: '0x123%2Ffoo', id: undefined },
        expected: { decodedAsset: '0x123/foo' },
      },
    ];

    // @ts-expect-error This function is missing from the Mocha type definitions
    it.each(testCases)(
      '$name',
      ({ params, expected }: (typeof testCases)[number]) => {
        expect(processAssetParams(params)).toMatchObject(expected);
      },
    );
  });

  it('returns an undefined decodedAsset when no params are present', () => {
    expect(processAssetParams({}).decodedAsset).toBeUndefined();
  });
});
