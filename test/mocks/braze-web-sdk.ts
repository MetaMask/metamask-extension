/**
 * Keep unrelated UI tests from activating Braze. Lifecycle tests use the real
 * SDK with network I/O mocked at the browser boundary.
 */

export const initialize = jest.fn().mockReturnValue(true);
export const isInitialized = jest.fn().mockReturnValue(false);
export const getUser = jest.fn();
export const changeUser = jest.fn();
export const destroy = jest.fn();
export const wipeData = jest.fn();
