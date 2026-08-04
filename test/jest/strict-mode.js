/**
 * Jest-only helper for exercising React.StrictMode double-mount behavior.
 *
 * Import this module as the FIRST import in a test file (before importing
 * '@testing-library/react' or '@testing-library/react-hooks') to mock their
 * render/renderHook APIs so they wrap the UI in <React.StrictMode />.
 *
 * Do not register this file in `jest.config.js` setupFilesAfterEnv — enabling
 * StrictMode globally breaks many existing unit tests that assume a single mount.
 *
 * NOTE: `@testing-library/react-hooks` remains only for tests that still use
 * `waitForNextUpdate` (see MetaMask-planning#6924). After that migration, remove
 * the react-hooks mock below and the package itself.
 */
jest.mock('@testing-library/react', () => {
  // eslint-disable-next-line n/global-require -- required inside jest.mock factory
  const React = require('react');
  const actual = jest.requireActual('@testing-library/react');

  const mockWrapWithStrictMode = (element) =>
    React.createElement(React.StrictMode, null, element);

  const mockCreateStrictModeWrapper = (userWrapper) => {
    if (!userWrapper) {
      return ({ children }) => mockWrapWithStrictMode(children);
    }

    return function MockStrictModeUserWrapper({ children }) {
      return mockWrapWithStrictMode(
        React.createElement(userWrapper, null, children),
      );
    };
  };

  return {
    ...actual,
    render(ui, options = {}) {
      const { wrapper: userWrapper, ...rest } = options;

      if (!userWrapper) {
        return actual.render(mockWrapWithStrictMode(ui), rest);
      }

      return actual.render(ui, {
        ...rest,
        wrapper: mockCreateStrictModeWrapper(userWrapper),
      });
    },
    renderHook(callback, options = {}) {
      const { wrapper: userWrapper, ...rest } = options;

      return actual.renderHook(callback, {
        ...rest,
        wrapper: mockCreateStrictModeWrapper(userWrapper),
      });
    },
  };
});

// Kept until waitForNextUpdate → waitFor migration (MetaMask-planning#6924).
jest.mock('@testing-library/react-hooks', () => {
  // eslint-disable-next-line n/global-require -- required inside jest.mock factory
  const React = require('react');
  const actual = jest.requireActual('@testing-library/react-hooks');

  const mockWrapWithStrictMode = (element) =>
    React.createElement(React.StrictMode, null, element);

  const mockCreateStrictModeWrapper = (userWrapper) => {
    if (!userWrapper) {
      return ({ children }) => mockWrapWithStrictMode(children);
    }

    return function MockStrictModeUserWrapper({ children }) {
      return mockWrapWithStrictMode(
        React.createElement(userWrapper, null, children),
      );
    };
  };

  return {
    ...actual,
    renderHook(callback, options = {}) {
      const { wrapper: userWrapper, ...rest } = options;

      return actual.renderHook(callback, {
        ...rest,
        wrapper: mockCreateStrictModeWrapper(userWrapper),
      });
    },
  };
});
