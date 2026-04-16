import { CONFIRM_TRANSACTION_ROUTE } from '../../helpers/constants/routes';
import {
  extractIdFromPathname,
  getRelativeLocationForNestedRoutes,
} from './utils';

describe('extractIdFromPathname', () => {
  const BASE_ROUTE = `${CONFIRM_TRANSACTION_ROUTE}/`;
  const EXAMPLE_PATHNAME = `${CONFIRM_TRANSACTION_ROUTE}/abc123`;
  const EXAMPLE_PATHNAME_WITH_QUERY = `${CONFIRM_TRANSACTION_ROUTE}/abc123?foo=bar&baz=qux`;
  const EXAMPLE_PATHNAME_WITH_HASH = `${CONFIRM_TRANSACTION_ROUTE}/abc123#section`;
  const EXAMPLE_PATHNAME_WITH_BOTH = `${CONFIRM_TRANSACTION_ROUTE}/abc123?query=value#hash`;

  describe('successful extraction', () => {
    it('extracts ID from simple pathname', () => {
      expect(extractIdFromPathname(EXAMPLE_PATHNAME, BASE_ROUTE)).toBe(
        'abc123',
      );
    });

    it('extracts ID from pathname with query parameters', () => {
      expect(
        extractIdFromPathname(EXAMPLE_PATHNAME_WITH_QUERY, BASE_ROUTE),
      ).toBe('abc123');
    });

    it('extracts ID from pathname with hash fragment', () => {
      expect(
        extractIdFromPathname(EXAMPLE_PATHNAME_WITH_HASH, BASE_ROUTE),
      ).toBe('abc123');
    });

    it('extracts ID from pathname with both query params and hash', () => {
      expect(
        extractIdFromPathname(EXAMPLE_PATHNAME_WITH_BOTH, BASE_ROUTE),
      ).toBe('abc123');
    });

    it('extracts numeric ID', () => {
      expect(
        extractIdFromPathname(`${CONFIRM_TRANSACTION_ROUTE}/12345`, BASE_ROUTE),
      ).toBe('12345');
    });

    it('extracts UUID-style ID', () => {
      expect(
        extractIdFromPathname(
          `${CONFIRM_TRANSACTION_ROUTE}/123e4567-e89b-12d3-a456-426614174000`,
          BASE_ROUTE,
        ),
      ).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('extracts ID with special characters (encoded)', () => {
      expect(
        extractIdFromPathname(
          `${CONFIRM_TRANSACTION_ROUTE}/abc%20123`,
          BASE_ROUTE,
        ),
      ).toBe('abc%20123');
    });
  });

  describe('null returns', () => {
    it('returns null when pathname is empty', () => {
      expect(extractIdFromPathname('', BASE_ROUTE)).toBeNull();
    });

    it('returns null when baseRoute is empty', () => {
      expect(extractIdFromPathname(EXAMPLE_PATHNAME, '')).toBeNull();
    });

    it('returns null when pathname does not contain baseRoute', () => {
      expect(
        extractIdFromPathname('/other-route/abc123', BASE_ROUTE),
      ).toBeNull();
    });

    it('returns null when pathname equals baseRoute (no ID)', () => {
      expect(extractIdFromPathname(BASE_ROUTE, BASE_ROUTE)).toBeNull();
    });

    it('returns null when pathname is just baseRoute without trailing content', () => {
      expect(
        extractIdFromPathname(CONFIRM_TRANSACTION_ROUTE, BASE_ROUTE),
      ).toBeNull();
    });

    it('returns null when ID part is empty after query', () => {
      expect(
        extractIdFromPathname(`${BASE_ROUTE}?query=value`, BASE_ROUTE),
      ).toBeNull();
    });

    it('returns null when ID part is empty after hash', () => {
      expect(
        extractIdFromPathname(`${BASE_ROUTE}#hash`, BASE_ROUTE),
      ).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('handles pathname with baseRoute appearing multiple times', () => {
      // Should split on first occurrence
      expect(
        extractIdFromPathname(
          `${CONFIRM_TRANSACTION_ROUTE}/confirm-transaction/abc`,
          BASE_ROUTE,
        ),
      ).toBe('confirm-transaction');
    });

    it('returns null when baseRoute is missing trailing slash', () => {
      // This is an edge case - the function expects baseRoute to have a trailing slash
      // Without it, the split logic produces an invalid result
      expect(
        extractIdFromPathname(EXAMPLE_PATHNAME, CONFIRM_TRANSACTION_ROUTE),
      ).toBeNull();
    });

    it('handles different base routes', () => {
      const CONFIRMATION_ROUTE = '/confirmation/';
      expect(
        extractIdFromPathname('/confirmation/xyz789', CONFIRMATION_ROUTE),
      ).toBe('xyz789');
    });

    it('handles pathname with trailing slash after ID', () => {
      expect(extractIdFromPathname(`${EXAMPLE_PATHNAME}/`, BASE_ROUTE)).toBe(
        'abc123',
      );
    });

    it('handles nested paths after ID', () => {
      expect(
        extractIdFromPathname(`${EXAMPLE_PATHNAME}/nested/path`, BASE_ROUTE),
      ).toBe('abc123');
    });
  });

  describe('type safety', () => {
    it('returns null for null pathname', () => {
      expect(
        extractIdFromPathname(null as unknown as string, BASE_ROUTE),
      ).toBeNull();
    });

    it('returns null for undefined pathname', () => {
      expect(
        extractIdFromPathname(undefined as unknown as string, BASE_ROUTE),
      ).toBeNull();
    });

    it('returns null for null baseRoute', () => {
      expect(
        extractIdFromPathname(EXAMPLE_PATHNAME, null as unknown as string),
      ).toBeNull();
    });

    it('returns null for undefined baseRoute', () => {
      expect(
        extractIdFromPathname(EXAMPLE_PATHNAME, undefined as unknown as string),
      ).toBeNull();
    });
  });
});

describe('getRelativeLocationForNestedRoutes', () => {
  it('should return relative pathname when location starts with basePath', () => {
    const location = {
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
    const location = {
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
    ) as typeof location;

    expect(result.pathname).toBe('/');
  });

  it('should preserve all location properties except pathname', () => {
    const location = {
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
    const location = {
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
    ) as typeof location;

    expect(result.pathname).toBe('/settings/advanced');
  });

  it('should handle nested paths with multiple segments', () => {
    const location = {
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
    ) as typeof location;

    expect(result.pathname).toBe('/snap-update/review');
  });

  it('should handle empty basePath', () => {
    const location = {
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
    ) as typeof location;

    expect(result.pathname).toBe('/connect/abc123');
  });

  it('should handle basePath with trailing slash', () => {
    const location = {
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
    ) as typeof location;

    expect(result.pathname).toBe('/snaps-connect');
  });

  it('should return "/" when pathname is basePath with trailing slash', () => {
    const location = {
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
    ) as typeof location;

    expect(result.pathname).toBe('/');
  });

  it('should not mutate the original location object', () => {
    const location = {
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
    const location = {
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
    ) as typeof location;

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
      const location = {
        pathname,
        search: '',
        hash: '',
        state: undefined,
        key: '',
      };
      const result = getRelativeLocationForNestedRoutes(
        location,
        basePath,
      ) as typeof location;
      expect(result.pathname).toBe(expected);
    });
  });
});
