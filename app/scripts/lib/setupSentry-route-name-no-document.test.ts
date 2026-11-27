/**
 * @jest-environment node
 */
import { nameRouteSpanAfterDocument } from './setupSentry';

// Workers and test runners can lack `location`, or have one with no path.
describe('nameRouteSpanAfterDocument without a document path', () => {
  const options = { name: '#/unlock', op: 'navigation' };
  const globals = globalThis as { location?: unknown };

  afterEach(() => {
    delete globals.location;
  });

  it('keeps the SDK name when there is no location', () => {
    expect(globals.location).toBeUndefined();

    expect(nameRouteSpanAfterDocument(options)).toStrictEqual(options);
  });

  it('keeps the SDK name when the location has no pathname', () => {
    globals.location = { pathname: '' };

    expect(nameRouteSpanAfterDocument(options)).toStrictEqual(options);
  });
});
