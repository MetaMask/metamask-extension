import { DEFAULT_ROUTE, Route } from './route';

export enum GatorPermissionsQueryParams {
  Type = 'type',
  Site = 'site',
}

function isValidOrigin(originString: string): boolean {
  try {
    const url = new URL(originString);
    // The URL constructor ensures proper URL formatting.
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false;
    }
    return originString === url.origin;
  } catch (e) {
    // If new URL() throws a TypeError, the string is not a valid URL format
    return false;
  }
}

export const gatorPermissions = new Route({
  pathname: '/gator-permissions',
  getTitle: (_: URLSearchParams) => 'deepLink_theGatorPermissionsPage',
  handler: function handler(params: URLSearchParams) {
    const type = params.get(GatorPermissionsQueryParams.Type);
    const site = params.get(GatorPermissionsQueryParams.Site);
    const query = new URLSearchParams();
    if (!type) {
      throw new Error('Missing type parameter');
    }

    if (type !== 'token-transfer') {
      throw new Error('Invalid type parameter');
    }

    if (!site) {
      throw new Error('Missing site parameter');
    }

    if (isValidOrigin(site)) {
      return { path: `/gator-permissions/token-transfer/${site}`, query };
    }
    return { path: DEFAULT_ROUTE, query };
  },
});
