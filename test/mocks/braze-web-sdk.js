/* global jest -- Global defined by Jest */
/**
 * Stub for `@braze/web-sdk`. The real package is ESM and talks to the network;
 * most tests use this stub. Lifecycle tests opt into the real SDK with I/O mocked.
 */

export const initialize = jest.fn().mockReturnValue(true);
export const changeUser = jest.fn();
export const destroy = jest.fn();
export const wipeData = jest.fn();
