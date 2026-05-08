import { getChecksummedEvmAssetId } from './utils';

describe('getChecksummedEvmAssetId', () => {
  it('checksums a lowercase ERC-20 address on an EVM chain', () => {
    const input = 'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
    const result = getChecksummedEvmAssetId(input);

    // Address part should be EIP-55 checksummed
    expect(result).toBe(
      'eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    );
  });

  it('leaves an already-checksummed ERC-20 asset id unchanged', () => {
    const input = 'eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
    const result = getChecksummedEvmAssetId(input);

    expect(result).toBe(input);
  });

  it('returns the original asset id for a native slip44 asset', () => {
    const input = 'eip155:1/slip44:60';
    const result = getChecksummedEvmAssetId(input);

    expect(result).toBe(input);
  });

  it('returns the original asset id for a non-EVM ERC-20-like asset (Solana SPL token)', () => {
    const input =
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
    const result = getChecksummedEvmAssetId(input);

    expect(result).toBe(input);
  });

  it('returns the original asset id when parsing throws (malformed input)', () => {
    // parseCaipAssetType will throw on a non-CAIP string
    const malformed = 'not-a-caip-asset-id' as never;
    const result = getChecksummedEvmAssetId(malformed);

    expect(result).toBe(malformed);
  });

  it('returns the original asset id for an ERC-20 on a non-EVM chain namespace', () => {
    // Even if the assetNamespace looks like erc20, the chainId does not start with eip155:
    // Use a real CAIP format so parseCaipAssetType does not throw.
    // We simulate this by using a solana namespace with erc20 to verify the guard.
    const input =
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
    const result = getChecksummedEvmAssetId(input as never);

    expect(result).toBe(input);
  });
});
