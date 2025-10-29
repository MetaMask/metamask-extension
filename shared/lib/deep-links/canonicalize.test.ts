import { canonicalize } from './canonicalize';
import { SIG_PARAM, SIG_PARAMS_PARAM } from './constants';

describe('canonicalize', () => {
  it('removes the sig parameter and sorts the rest', () => {
    const url = new URL(`https://example.com/path?a=2&${SIG_PARAM}=abc&b=1`);
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
    const url = new URL(
      `https://example.com/path?${SIG_PARAM}=abc&${SIG_PARAM}=def&a=1`,
    );
    expect(canonicalize(url)).toBe('https://example.com/path?a=1');
  });

  it('handles URLs with only the sig parameter', () => {
    const url = new URL(`https://example.com/path?${SIG_PARAM}=abc`);
    expect(canonicalize(url)).toBe('https://example.com/path');
  });

  it('handles URLs with multiple parameters including sig in the middle', () => {
    const url = new URL(`https://example.com/path?b=2&${SIG_PARAM}=xyz&a=1`);
    expect(canonicalize(url)).toBe('https://example.com/path?a=1&b=2');
  });

  it('handles URLs with repeated parameters (except sig)', () => {
    const url = new URL(`https://example.com/path?a=1&a=2&${SIG_PARAM}=abc`);
    expect(canonicalize(url)).toBe('https://example.com/path?a=1&a=2');
  });

  it('does not mutate the original URL', () => {
    const url = new URL(`https://example.com/path?a=1&${SIG_PARAM}=abc`);
    canonicalize(url);
    expect(url.searchParams.get(SIG_PARAM)).toBe('abc');
  });

  it('keeps only parameters listed in sig_params and re-sorts them', () => {
    const url = new URL(
      `https://example.com/path?a=2&b=1&c=9&${SIG_PARAM}=abc&${SIG_PARAMS_PARAM}=a%2Cb`,
    );
    // Only a and b should remain, plus sig_params itself, sorted by key
    expect(canonicalize(url)).toBe(
      'https://example.com/path?a=2&b=1&sig_params=a%2Cb',
    );
  });

  it('preserves repeated values for allowed params listed in sig_params', () => {
    const url = new URL(
      `https://example.com/path?a=1&a=2&c=9&${SIG_PARAMS_PARAM}=a`,
    );
    expect(canonicalize(url)).toBe(
      'https://example.com/path?a=1&a=2&sig_params=a',
    );
  });

  it('includes only sig_params when none of the listed keys are present', () => {
    const url = new URL(
      `https://example.com/path?x=1&y=2&${SIG_PARAMS_PARAM}=c`,
    );
    // No c param present, so only sig_params should remain
    expect(canonicalize(url)).toBe('https://example.com/path?sig_params=c');
  });

  it('does not mutate the original URL when sig_params is present', () => {
    const original = new URL(
      `https://example.com/path?a=2&b=1&${SIG_PARAM}=abc&${SIG_PARAMS_PARAM}=a,b`,
    );
    const before = original.toString();
    canonicalize(original);
    expect(original.toString()).toBe(before);
    expect(original.searchParams.get(SIG_PARAM)).toBe('abc');
    expect(original.searchParams.get(SIG_PARAMS_PARAM)).toBe('a,b');
  });
});
