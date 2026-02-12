import { act } from '@testing-library/react';
import { ThemeType } from '../../shared/constants/preferences';
import { renderHookWithProvider } from '../../test/lib/render-helpers-navigate';
import { useTheme } from './useTheme';

jest.mock('../selectors/multi-srp/multi-srp', () => ({
  getShouldShowSeedPhraseReminder: () => false,
}));

// Helper to create a mock MediaQueryList
const createMockMediaQueryList = (matches: boolean) => {
  const listeners: ((event: MediaQueryListEvent) => void)[] = [];
  return {
    matches,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addListener: jest.fn(), // deprecated but included for compatibility
    removeListener: jest.fn(), // deprecated but included for compatibility
    addEventListener: jest.fn(
      (_event: string, listener: (event: MediaQueryListEvent) => void) => {
        listeners.push(listener);
      },
    ),
    removeEventListener: jest.fn(
      (_event: string, listener: (event: MediaQueryListEvent) => void) => {
        const index = listeners.indexOf(listener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      },
    ),
    dispatchEvent: jest.fn(),
    // Helper to trigger change event for testing
    triggerChange: (newMatches: boolean) => {
      listeners.forEach((listener) => {
        listener({ matches: newMatches } as MediaQueryListEvent);
      });
    },
    listeners,
  };
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderProviderWithTheme: any = (
  settingTheme = ThemeType.light,
  systemPrefersDark = false,
) => {
  const mockMediaQueryList = createMockMediaQueryList(systemPrefersDark);

  // Mock matchMedia to return our mock MediaQueryList
  jest
    .spyOn(window, 'matchMedia')
    .mockImplementation(() => mockMediaQueryList as unknown as MediaQueryList);

  /** This value found in the document should reflect the user's setting, and if applicable, their OS setting */
  const documentTheme = systemPrefersDark ? ThemeType.dark : ThemeType.light;
  jest
    .spyOn(global.document.documentElement, 'getAttribute')
    .mockReturnValue(documentTheme);

  const mockState = { metamask: { theme: settingTheme } };
  const renderResult = renderHookWithProvider(() => useTheme(), mockState);

  return {
    ...renderResult,
    mockMediaQueryList,
  };
};

describe('useTheme', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it(`returns ${ThemeType.dark} when the theme setting is "${ThemeType.dark}"`, () => {
    const { result } = renderProviderWithTheme(ThemeType.dark, true);
    expect(result.current).toBe(ThemeType.dark);
  });

  it(`returns ${ThemeType.light} when the theme setting is "${ThemeType.light}"`, () => {
    const { result } = renderProviderWithTheme(ThemeType.light);
    expect(result.current).toBe(ThemeType.light);
  });

  describe(`when the theme setting is "${ThemeType.os}"`, () => {
    it(`returns ${ThemeType.dark} when the os is in dark mode`, () => {
      const { result } = renderProviderWithTheme(ThemeType.os, true);
      expect(result.current).toBe(ThemeType.dark);
    });

    it(`returns ${ThemeType.light} when the os is in light mode`, () => {
      const { result } = renderProviderWithTheme(ThemeType.os, false);
      expect(result.current).toBe(ThemeType.light);
    });

    it('updates theme when system theme changes from light to dark', () => {
      const { result, mockMediaQueryList } = renderProviderWithTheme(
        ThemeType.os,
        false,
      );
      expect(result.current).toBe(ThemeType.light);

      // Simulate system theme change to dark
      act(() => {
        mockMediaQueryList.triggerChange(true);
      });

      expect(result.current).toBe(ThemeType.dark);
    });

    it('updates theme when system theme changes from dark to light', () => {
      const { result, mockMediaQueryList } = renderProviderWithTheme(
        ThemeType.os,
        true,
      );
      expect(result.current).toBe(ThemeType.dark);

      // Simulate system theme change to light
      act(() => {
        mockMediaQueryList.triggerChange(false);
      });

      expect(result.current).toBe(ThemeType.light);
    });
  });

  it('does not change theme on system change when theme setting is explicit', () => {
    const { result, mockMediaQueryList } = renderProviderWithTheme(
      ThemeType.dark,
      false,
    );
    expect(result.current).toBe(ThemeType.dark);

    // Simulate system theme change - should not affect explicit theme setting
    act(() => {
      mockMediaQueryList.triggerChange(true);
    });

    // Theme should still be dark because user explicitly set it
    expect(result.current).toBe(ThemeType.dark);
  });
});
