import { ThemeType } from '../../shared/constants/preferences';
import { renderHookWithProvider } from '../../test/lib/render-helpers';
import { useTheme } from './useTheme';

jest.mock('../selectors', () => ({
  getTheme: jest.fn(),
}));

const renderProviderWithTheme: any = (
  settingTheme = ThemeType.light,
  documentTheme = ThemeType.light,
) => {
  /** This value found in the document should reflect the user's setting, and if applicable, their OS setting */
  jest
    .spyOn(global.document.documentElement, 'getAttribute')
    .mockReturnValue(documentTheme);

  const mockState = { metamask: { theme: settingTheme } };
  return renderHookWithProvider(() => useTheme(), mockState);
};

describe('useTheme', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it(`returns ${ThemeType.dark} when the theme setting is "${ThemeType.dark}"`, () => {
    const { result } = renderProviderWithTheme(ThemeType.dark, ThemeType.dark);
    expect(result.current).toBe(ThemeType.dark);
  });

  it(`returns ${ThemeType.light} when the theme setting is "${ThemeType.light}"`, () => {
    const { result } = renderProviderWithTheme(ThemeType.light);
    expect(result.current).toBe(ThemeType.light);
  });

  describe(`when the theme setting is "${ThemeType.os}"`, () => {
    it(`returns ${ThemeType.dark} when the os is in dark mode`, () => {
      const { result } = renderProviderWithTheme(ThemeType.os, ThemeType.dark);
      expect(result.current).toBe(ThemeType.dark);
    });

    it(`returns ${ThemeType.light} when the os is in light mode`, () => {
      const { result } = renderProviderWithTheme(ThemeType.os);
      expect(result.current).toBe(ThemeType.light);
    });
  });
});
