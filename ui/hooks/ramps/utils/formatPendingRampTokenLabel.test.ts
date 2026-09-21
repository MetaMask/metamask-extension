import { formatPendingRampTokenLabel } from './formatPendingRampTokenLabel';

describe('formatPendingRampTokenLabel', () => {
  it('includes the symbol when present', () => {
    expect(formatPendingRampTokenLabel('ETH')).toBe('... ETH');
  });

  it('returns ellipsis alone when symbol is missing', () => {
    expect(formatPendingRampTokenLabel()).toBe('...');
    expect(formatPendingRampTokenLabel('')).toBe('...');
  });
});
