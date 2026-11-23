import { resolveTokenDisplayName } from './resolve-token-display-name';

describe('resolveTokenDisplayName', () => {
  it('uses a metadata name that differs from the ticker', () => {
    expect(resolveTokenDisplayName('DOGE', 'Dogecoin')).toBe('Dogecoin');
  });

  it('keeps a case difference between the name and the ticker', () => {
    expect(resolveTokenDisplayName('PEPE', 'Pepe')).toBe('Pepe');
  });

  it('skips a candidate that repeats the ticker and uses the next distinct name', () => {
    expect(resolveTokenDisplayName('USDC', 'USDC', 'USD Coin')).toBe(
      'USD Coin',
    );
  });

  it('falls back to the ticker when no distinct name is available', () => {
    expect(resolveTokenDisplayName('ETH', 'ETH', '  ETH  ', undefined)).toBe(
      'ETH',
    );
    expect(resolveTokenDisplayName('ETH')).toBe('ETH');
  });

  it('trims the chosen name', () => {
    expect(resolveTokenDisplayName('DOGE', '  Dogecoin  ')).toBe('Dogecoin');
  });
});
