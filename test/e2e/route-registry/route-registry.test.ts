import { ROUTE_PAGE_OBJECT_REGISTRY } from './route-registry';

describe('ROUTE_PAGE_OBJECT_REGISTRY', () => {
  it('maps every path to a page object class or null', () => {
    for (const [path, pageObject] of Object.entries(
      ROUTE_PAGE_OBJECT_REGISTRY,
    )) {
      expect([path, pageObject === null || typeof pageObject]).toStrictEqual([
        path,
        pageObject === null ? true : 'function',
      ]);
    }
  });

  it('keys entries by route path', () => {
    for (const path of Object.keys(ROUTE_PAGE_OBJECT_REGISTRY)) {
      expect(path === '' || path.startsWith('/')).toBe(true);
    }
  });
});
