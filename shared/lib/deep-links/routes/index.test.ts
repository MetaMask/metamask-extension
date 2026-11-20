import { it as jestIt } from '@jest/globals';
import { home } from './home';
import { matchRoute, routes } from '.';

function getRegisteredPathnames(children: typeof routes): string[] {
  return [...children.values()].flatMap((node) => [
    ...(node.route ? [node.route.pathname] : []),
    ...getRegisteredPathnames(node.children),
  ]);
}

function isValidRoutePattern(pathname: string): boolean {
  return (
    pathname.startsWith('/') &&
    !/\/\*\/+$/u.test(pathname) &&
    pathname
      .split('/')
      .every((segment) => segment === '*' || !segment.includes('*'))
  );
}

const registeredPathnames = getRegisteredPathnames(routes);

describe('registered route patterns', () => {
  it('registers built-in routes through the index', () => {
    expect(matchRoute('/home')).toBe(home);
  });

  it('uses only supported wildcard patterns', () => {
    expect(registeredPathnames.length).toBeGreaterThan(0);
    expect(
      registeredPathnames.filter((pathname) => !isValidRoutePattern(pathname)),
    ).toStrictEqual([]);
  });

  jestIt.each(['/social', '/social/*', '/social/*/whatever'])(
    'allows the pattern %s',
    (pathname) => {
      expect(isValidRoutePattern(pathname)).toBe(true);
    },
  );

  jestIt.each([
    '/social/*/',
    '/social/*//',
    '/social/pre*',
    '/social/*suffix',
    '/social/**',
  ])('rejects the pattern %s in tests', (pathname) => {
    expect(isValidRoutePattern(pathname)).toBe(false);
  });
});
