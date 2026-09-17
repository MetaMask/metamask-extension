/* global jest -- Global defined by Jest */
/**
 * Stub for `@braze/web-sdk`. The real package is ESM and talks to the network;
 * unit and integration tests must not load it.
 */

export const initialize = jest.fn().mockReturnValue(true);
