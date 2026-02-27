import { normalizeAddress } from '../normalizeAddress';

describe('normalizeAddress', () => {
  it('lowercases an Ethereum address', () => {
    const address = '0xAbC123';
    expect(normalizeAddress(address)).toBe('0xabc123');
  });
});
