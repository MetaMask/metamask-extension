import { CASHTAG_WIDGET_UPDATES, isCashtagThemeUpdate } from './theme';

describe('isCashtagThemeUpdate', () => {
  it('accepts a valid cashtag theme update', () => {
    expect(
      isCashtagThemeUpdate({
        type: CASHTAG_WIDGET_UPDATES.Theme,
        theme: 'dark',
      }),
    ).toBe(true);
  });

  it('rejects an invalid theme or another widget update', () => {
    expect(
      isCashtagThemeUpdate({
        type: CASHTAG_WIDGET_UPDATES.Theme,
        theme: 'dim',
      }),
    ).toBe(false);
    expect(
      isCashtagThemeUpdate({ type: 'other-widget.theme', theme: 'dark' }),
    ).toBe(false);
  });
});
