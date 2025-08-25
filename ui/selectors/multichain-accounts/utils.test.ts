import { getSanitizedChainId } from './utils';

describe('getSanitizedChainId', () => {
  it('should return the chain ID if it is not an EIP-155 chain ID', () => {
    expect(getSanitizedChainId('solana:mainnet')).toBe('solana:mainnet');
  });

  it('should return the chain ID if it is an EIP-155 chain ID', () => {
    expect(getSanitizedChainId('eip155:1')).toBe('eip155:0');
  });
});
