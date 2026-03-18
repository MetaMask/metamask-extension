import {
  gatorPermissions,
  GatorPermissionsQueryParams,
} from './gator-permissions';
import { Destination } from './route';

function assertPathDestination(
  result: Destination,
): asserts result is Extract<Destination, { path: string }> {
  expect('path' in result).toBe(true);
}

describe('gatorPermissionsRoute', () => {
  describe('handler with valid parameters', () => {
    it('should return path and query with valid type and site', () => {
      const params = new URLSearchParams({
        [GatorPermissionsQueryParams.Type]: 'token-transfer',
        [GatorPermissionsQueryParams.Site]: 'https://example.com',
      });

      const result = gatorPermissions.handler(params);

      assertPathDestination(result);
      expect(result.path).toBe('/');
      expect(result.query.get(GatorPermissionsQueryParams.Type)).toBe(
        'token-transfer',
      );
      expect(result.query.get(GatorPermissionsQueryParams.Site)).toBe(
        'https://example.com',
      );
    });

    it('should handle http protocol in site parameter', () => {
      const params = new URLSearchParams({
        [GatorPermissionsQueryParams.Type]: 'token-transfer',
        [GatorPermissionsQueryParams.Site]: 'http://example.com',
      });

      const result = gatorPermissions.handler(params);

      assertPathDestination(result);
      expect(result.query.get(GatorPermissionsQueryParams.Site)).toBe(
        'http://example.com',
      );
    });

    it('should handle site with port number', () => {
      const params = new URLSearchParams({
        [GatorPermissionsQueryParams.Type]: 'token-transfer',
        [GatorPermissionsQueryParams.Site]: 'https://example.com:8080',
      });

      const result = gatorPermissions.handler(params);

      assertPathDestination(result);
      expect(result.query.get(GatorPermissionsQueryParams.Site)).toBe(
        'https://example.com:8080',
      );
    });
  });

  describe('handler with missing parameters', () => {
    it('should throw error when type parameter is missing', () => {
      const params = new URLSearchParams({
        [GatorPermissionsQueryParams.Site]: 'https://example.com',
      });

      expect(() => gatorPermissions.handler(params)).toThrow(
        'Missing type parameter',
      );
    });

    it('should throw error when site parameter is missing', () => {
      const params = new URLSearchParams({
        [GatorPermissionsQueryParams.Type]: 'token-transfer',
      });

      expect(() => gatorPermissions.handler(params)).toThrow(
        'Missing site parameter',
      );
    });

    it('should throw error when both type and site are missing', () => {
      const params = new URLSearchParams();

      expect(() => gatorPermissions.handler(params)).toThrow(
        'Missing type parameter',
      );
    });
  });

  describe('handler with invalid type parameter', () => {
    it('should throw error when type is not "token-transfer"', () => {
      const params = new URLSearchParams({
        [GatorPermissionsQueryParams.Type]: 'invalid-type',
        [GatorPermissionsQueryParams.Site]: 'https://example.com',
      });

      expect(() => gatorPermissions.handler(params)).toThrow(
        'Invalid type parameter',
      );
    });

    it('should throw error for empty type parameter', () => {
      const params = new URLSearchParams({
        [GatorPermissionsQueryParams.Type]: '',
        [GatorPermissionsQueryParams.Site]: 'https://example.com',
      });

      expect(() => gatorPermissions.handler(params)).toThrow(
        'Invalid type parameter',
      );
    });
  });

  describe('handler with invalid site parameter', () => {
    type InvalidSiteTestCase = {
      site: string;
      description: string;
    };

    const invalidSiteCases: InvalidSiteTestCase[] = [
      { site: 'not-a-url', description: 'invalid URL format' },
      { site: 'ftp://example.com', description: 'unsupported protocol (ftp)' },
      { site: 'data:text/html,<h1>test</h1>', description: 'data URI' },
      // eslint-disable-next-line no-script-url
      { site: 'javascript:alert(1)', description: 'javascript protocol' },
      { site: 'https://example.com:notaport', description: 'invalid port' },
      {
        site: 'https://example.com/path',
        description: 'URL with path instead of origin',
      },
      {
        site: 'https://example.com?query=1',
        description: 'URL with query params instead of origin',
      },
      {
        site: 'https://example.com#hash',
        description: 'URL with hash instead of origin',
      },
    ];

    // @ts-expect-error This function is missing from the Mocha type definitions
    it.each(invalidSiteCases)(
      'should not include invalid site in query: $description',
      ({ site }: InvalidSiteTestCase) => {
        const params = new URLSearchParams({
          [GatorPermissionsQueryParams.Type]: 'token-transfer',
          [GatorPermissionsQueryParams.Site]: site,
        });

        const result = gatorPermissions.handler(params);

        assertPathDestination(result);
        expect(result.query.has(GatorPermissionsQueryParams.Site)).toBe(false);
      },
    );
  });

  describe('getTitle', () => {
    it('should return the correct title key', () => {
      const params = new URLSearchParams();
      const title = gatorPermissions.getTitle(params);

      expect(title).toBe('deepLink_theGatorPermissionsPage');
    });
  });

  describe('pathname', () => {
    it('should have correct pathname', () => {
      expect(gatorPermissions.pathname).toBe('/gator-permissions');
    });
  });
});
