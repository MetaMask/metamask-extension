import { canonicalize } from './canonicalize';

describe('canonicalize', () => {
  it('removes the sig parameter and sorts the rest', () => {
    const url = new URL('https://example.com/path?a=2&sig=abc&b=1');
    expect(canonicalize(url)).toBe('https://example.com/path?a=2&b=1');
  });

  it('returns the same URL if there are no query parameters', () => {
    const url = new URL('https://example.com/path');
    expect(canonicalize(url)).toBe('https://example.com/path');
  });

  it('returns the same URL if there is no sig parameter', () => {
    const url = new URL('https://example.com/path?foo=bar&baz=qux');
    expect(canonicalize(url)).toBe('https://example.com/path?baz=qux&foo=bar');
  });

  it('removes all sig parameters if there are multiple', () => {
    const url = new URL('https://example.com/path?sig=abc&sig=def&a=1');
    expect(canonicalize(url)).toBe('https://example.com/path?a=1');
  });

  it('handles URLs with only the sig parameter', () => {
    const url = new URL('https://example.com/path?sig=abc');
    expect(canonicalize(url)).toBe('https://example.com/path');
  });

  it('handles URLs with multiple parameters including sig in the middle', () => {
    const url = new URL('https://example.com/path?b=2&sig=xyz&a=1');
    expect(canonicalize(url)).toBe('https://example.com/path?a=1&b=2');
  });

  it('handles URLs with repeated parameters (except sig)', () => {
    const url = new URL('https://example.com/path?a=1&a=2&sig=abc');
    expect(canonicalize(url)).toBe('https://example.com/path?a=1&a=2');
  });

  it('does not mutate the original URL', () => {
    const url = new URL('https://example.com/path?a=1&sig=abc');
    canonicalize(url);
    expect(url.searchParams.get('sig')).toBe('abc');
  });
});
