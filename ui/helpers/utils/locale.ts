// Combines the app language with the browser's region for number/date formatting.
export function resolveFormattingLocale({
  appLanguage,
  deviceLocales,
}: {
  appLanguage: string;
  deviceLocales: readonly string[];
}) {
  try {
    const appLocale = new Intl.Locale(
      Intl.getCanonicalLocales(appLanguage.replaceAll('_', '-'))[0],
    );

    // Find first device locale with a region
    let deviceLocale: Intl.Locale | undefined;
    for (const tag of deviceLocales) {
      try {
        const locale = new Intl.Locale(tag);
        if (locale.region) {
          deviceLocale = locale;
          break;
        }
      } catch {
        // Invalid tag, skip
      }
    }

    if (!deviceLocale) {
      return appLocale.toString();
    }

    // Apply the device region; minimize keeps only non-default subtags
    return new Intl.Locale(appLocale.maximize(), {
      region: deviceLocale.region,
    })
      .minimize()
      .toString();
  } catch {
    return 'en';
  }
}
