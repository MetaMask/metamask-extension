import { Route, RouteOptions, Destination } from './route';

describe('Route', () => {
  const mockGetTitle = jest.fn(
    (params: URLSearchParams) => `Title: ${params.get('foo')}`,
  );
  const mockHandler = jest.fn(
    (params: URLSearchParams): Destination => ({
      path: `/handled/${params.get('foo')}`,
      query: params,
    }),
  );

  const options: RouteOptions = {
    pathname: '/My/Path',
    getTitle: mockGetTitle,
    handler: mockHandler,
  };

  let route: Route;

  beforeEach(() => {
    jest.clearAllMocks();
    route = new Route(options);
  });

  it('should set pathname to lowercase', () => {
    expect(route.pathname).toBe('/my/path');
  });

  it('should assign getTitle and handler from options', () => {
    expect(route.getTitle).toBe(mockGetTitle);
    expect(route.handler).toBe(mockHandler);
  });

  it('should call getTitle with URLSearchParams', () => {
    const params = new URLSearchParams({ foo: 'bar' });
    route.getTitle(params);
    expect(mockGetTitle).toHaveBeenCalledWith(params);
  });

  it('should call handler with URLSearchParams and return a Destination', () => {
    const params = new URLSearchParams({ foo: 'baz' });
    const result = route.handler(params);
    expect(mockHandler).toHaveBeenCalledWith(params);
    expect(result).toStrictEqual({
      path: '/handled/baz',
      query: params,
    });
  });

  it('should throw if handler throws', () => {
    const errorHandler = jest.fn(() => {
      throw new Error('fail');
    });
    const errorRoute = new Route({ ...options, handler: errorHandler });
    expect(() => errorRoute.handler(new URLSearchParams())).toThrow('fail');
  });
});
