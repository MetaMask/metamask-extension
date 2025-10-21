import { Location as RouterLocation } from 'react-router-dom-v5-compat';
import { getRelativeLocationForNestedRoutes } from './utils';

describe('getRelativeLocationForNestedRoutes', () => {
  it('should return relative pathname when location starts with basePath', () => {
    const location: RouterLocation = {
      pathname: '/connect/abc123/snaps-connect',
      search: '?query=test',
      hash: '#section',
      state: { foo: 'bar' },
      key: '',
    };
    const basePath = '/connect/abc123';

    const result = getRelativeLocationForNestedRoutes(location, basePath);

    expect(result).toEqual({
      pathname: '/snaps-connect',
      search: '?query=test',
      hash: '#section',
      state: { foo: 'bar' },
      key: '',
    });
  });

  it('should return "/" when pathname exactly matches basePath', () => {
    const location: RouterLocation = {
      pathname: '/connect/abc123',
      search: '',
      hash: '',
      state: undefined,
      key: '',
    };
    const basePath = '/connect/abc123';

    const result = getRelativeLocationForNestedRoutes(
      location,
      basePath,
    ) as RouterLocation;

    expect(result.pathname).toBe('/');
  });

  it('should preserve all location properties except pathname', () => {
    const location: RouterLocation = {
      pathname: '/connect/xyz789/snap-install',
      search: '?foo=bar&baz=qux',
      hash: '#heading',
      state: { from: '/home', test: true },
      key: 'abc123',
    };
    const basePath = '/connect/xyz789';

    const result = getRelativeLocationForNestedRoutes(location, basePath);

    expect(result).toEqual({
      pathname: '/snap-install',
      search: '?foo=bar&baz=qux',
      hash: '#heading',
      state: { from: '/home', test: true },
      key: 'abc123',
    });
  });

  it('should return original pathname when location does not start with basePath', () => {
    const location: RouterLocation = {
      pathname: '/settings/advanced',
      search: '',
      hash: '',
      state: undefined,
      key: '',
    };
    const basePath = '/connect/abc123';

    const result = getRelativeLocationForNestedRoutes(
      location,
      basePath,
    ) as RouterLocation;

    expect(result.pathname).toBe('/settings/advanced');
  });

  it('should handle nested paths with multiple segments', () => {
    const location: RouterLocation = {
      pathname: '/connect/id123/snap-update/review',
      search: '',
      hash: '',
      state: undefined,
      key: '',
    };
    const basePath = '/connect/id123';

    const result = getRelativeLocationForNestedRoutes(
      location,
      basePath,
    ) as RouterLocation;

    expect(result.pathname).toBe('/snap-update/review');
  });

  it('should handle empty basePath', () => {
    const location: RouterLocation = {
      pathname: '/connect/abc123',
      search: '',
      hash: '',
      state: undefined,
      key: '',
    };
    const basePath = '';

    const result = getRelativeLocationForNestedRoutes(
      location,
      basePath,
    ) as RouterLocation;

    expect(result.pathname).toBe('/connect/abc123');
  });

  it('should handle basePath with trailing slash', () => {
    const location: RouterLocation = {
      pathname: '/connect/abc123/snaps-connect',
      search: '',
      hash: '',
      state: undefined,
      key: '',
    };
    const basePath = '/connect/abc123/';

    const result = getRelativeLocationForNestedRoutes(
      location,
      basePath,
    ) as RouterLocation;

    expect(result.pathname).toBe('snaps-connect');
  });

  it('should return "/" when pathname is basePath with trailing slash', () => {
    const location: RouterLocation = {
      pathname: '/connect/abc123/',
      search: '',
      hash: '',
      state: undefined,
      key: '',
    };
    const basePath = '/connect/abc123';

    const result = getRelativeLocationForNestedRoutes(
      location,
      basePath,
    ) as RouterLocation;

    expect(result.pathname).toBe('/');
  });

  it('should not mutate the original location object', () => {
    const location: RouterLocation = {
      pathname: '/connect/abc123/snaps-connect',
      search: '?test=1',
      hash: '#top',
      state: undefined,
      key: '',
    };
    const originalPathname = location.pathname;
    const basePath = '/connect/abc123';

    getRelativeLocationForNestedRoutes(location, basePath);

    expect(location.pathname).toBe(originalPathname);
  });

  it('should handle special characters in pathname', () => {
    const location: RouterLocation = {
      pathname: '/connect/abc-123_456/snap-install',
      search: '',
      hash: '',
      state: undefined,
      key: '',
    };
    const basePath = '/connect/abc-123_456';

    const result = getRelativeLocationForNestedRoutes(
      location,
      basePath,
    ) as RouterLocation;

    expect(result.pathname).toBe('/snap-install');
  });

  it('should work with real-world permission connect routes', () => {
    const testCases: {
      pathname: string;
      basePath: string;
      expected: string;
    }[] = [
      {
        pathname: '/connect/-ZVKNcTT6CDpxHK9bc5tn/snaps-connect',
        basePath: '/connect/-ZVKNcTT6CDpxHK9bc5tn',
        expected: '/snaps-connect',
      },
      {
        pathname: '/connect/HEfPLJk2JliAmOQPv2uJt/confirm-permissions',
        basePath: '/connect/HEfPLJk2JliAmOQPv2uJt',
        expected: '/confirm-permissions',
      },
      {
        pathname: '/connect/xs6SFPJxNbT4gASU5QH3Z/snap-install',
        basePath: '/connect/xs6SFPJxNbT4gASU5QH3Z',
        expected: '/snap-install',
      },
      {
        pathname: '/connect/lDEodtmT-xo07k0uTHWIm',
        basePath: '/connect/lDEodtmT-xo07k0uTHWIm',
        expected: '/',
      },
    ];

    testCases.forEach(({ pathname, basePath, expected }) => {
      const location: RouterLocation = {
        pathname,
        search: '',
        hash: '',
        state: undefined,
        key: '',
      };
      const result = getRelativeLocationForNestedRoutes(
        location,
        basePath,
      ) as RouterLocation;
      expect(result.pathname).toBe(expected);
    });
  });
});
