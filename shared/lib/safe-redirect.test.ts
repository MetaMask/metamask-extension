import { sanitizeRedirectUrl } from './safe-redirect';

describe('sanitizeRedirectUrl', () => {
  it('returns pathname for a valid root-relative path', () => {
    expect(sanitizeRedirectUrl('/asset/0x1/0xabc')).toBe('/asset/0x1/0xabc');
  });

  it('preserves query strings', () => {
    expect(sanitizeRedirectUrl('/home?tab=tokens')).toBe('/home?tab=tokens');
  });

  it('strips fragments', () => {
    expect(sanitizeRedirectUrl('/page?q=1#fragment')).toBe('/page?q=1');
  });

  it('normalizes relative paths by prepending /', () => {
    expect(sanitizeRedirectUrl('some-relative-path')).toBe(
      '/some-relative-path',
    );
  });

  it('returns undefined for null', () => {
    expect(sanitizeRedirectUrl(null)).toBeUndefined();
  });

  it('returns undefined for undefined', () => {
    expect(sanitizeRedirectUrl(undefined)).toBeUndefined();
  });

  it('returns undefined for empty string', () => {
    expect(sanitizeRedirectUrl('')).toBeUndefined();
  });

  it('returns undefined for bare slash', () => {
    expect(sanitizeRedirectUrl('/')).toBeUndefined();
  });

  it('rejects protocol-relative URLs (//evil.com)', () => {
    expect(sanitizeRedirectUrl('//evil.com')).toBeUndefined();
  });

  it('rejects absolute URLs (https://evil.com)', () => {
    expect(sanitizeRedirectUrl('https://evil.com')).toBeUndefined();
  });

  it('rejects http absolute URLs', () => {
    expect(sanitizeRedirectUrl('http://evil.com/path')).toBeUndefined();
  });

  it('rejects backslash normalization attacks (/\\evil.com)', () => {
    expect(sanitizeRedirectUrl('/\\evil.com')).toBeUndefined();
  });

  it('rejects javascript: protocol scheme', () => {
    // eslint-disable-next-line no-script-url
    expect(sanitizeRedirectUrl('javascript:alert(1)')).toBeUndefined();
  });

  it('rejects data: protocol scheme', () => {
    expect(
      sanitizeRedirectUrl('data:text/html,<script>alert(1)</script>'),
    ).toBeUndefined();
  });

  it('rejects vbscript: protocol scheme', () => {
    expect(sanitizeRedirectUrl('vbscript:MsgBox("xss")')).toBeUndefined();
  });

  it('rejects protocol-relative with path (//evil.com/steal)', () => {
    expect(sanitizeRedirectUrl('//evil.com/steal')).toBeUndefined();
  });
});
