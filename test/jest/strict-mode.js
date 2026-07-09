/**
 * Wraps `@testing-library/react` and `@testing-library/react-hooks` in
 * React.StrictMode so unit tests exercise the same double-mount cycle as dev.
 * App entry (`ui/pages/index.js`) skips its own StrictMode when `IN_TEST` is
 * set to avoid nesting two StrictMode boundaries in integration renders.
 */
jest.mock('@testing-library/react', () => {
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
  };
});

jest.mock('@testing-library/react-hooks', () => {
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
