import hideKeyAndHttpsFromUrl from './utils';

describe('hideKeyAndHttpsFromUrl', () => {
  it('should return undefined for undefined input', () => {
    expect(hideKeyAndHttpsFromUrl(undefined)).toBeUndefined();
  });

  it('should hide http protocol', () => {
    expect(hideKeyAndHttpsFromUrl('http://example.com/path/to/resource')).toBe(
      'example.com/path/to',
    );
  });

  it('should hide https protocol', () => {
    expect(hideKeyAndHttpsFromUrl('https://example.com/path/to/resource')).toBe(
      'example.com/path/to',
    );
  });

  it('should return url without protocol unchanged', () => {
    expect(hideKeyAndHttpsFromUrl('example.com/path/to/resource')).toBe(
      'example.com/path/to',
    );
  });

  it('should handle url with no path segments', () => {
    expect(hideKeyAndHttpsFromUrl('http://example.com')).toBe('example.com');
    expect(hideKeyAndHttpsFromUrl('https://example.com')).toBe('example.com');
    expect(hideKeyAndHttpsFromUrl('example.com')).toBe('example.com');
  });

  it('should handle url with trailing slash', () => {
    expect(hideKeyAndHttpsFromUrl('http://example.com/path/to/')).toBe(
      'example.com/path/to',
    );
    expect(hideKeyAndHttpsFromUrl('https://example.com/path/to/')).toBe(
      'example.com/path/to',
    );
    expect(hideKeyAndHttpsFromUrl('example.com/path/to/')).toBe(
      'example.com/path/to',
    );
  });

  it('should handle urls with multiple path segments', () => {
    expect(
      hideKeyAndHttpsFromUrl('http://example.com/segment1/segment2/resource'),
    ).toBe('example.com/segment1/segment2');
    expect(
      hideKeyAndHttpsFromUrl('https://example.com/segment1/segment2/resource'),
    ).toBe('example.com/segment1/segment2');
    expect(
      hideKeyAndHttpsFromUrl('example.com/segment1/segment2/resource'),
    ).toBe('example.com/segment1/segment2');
  });

  it('should handle urls without a path', () => {
    expect(hideKeyAndHttpsFromUrl('http://example.com/')).toBe('example.com');
    expect(hideKeyAndHttpsFromUrl('https://example.com/')).toBe('example.com');
    expect(hideKeyAndHttpsFromUrl('example.com/')).toBe('example.com');
  });
});
