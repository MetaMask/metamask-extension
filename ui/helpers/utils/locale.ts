// Regions whose own currency is written as $, so USD needs marking (US$).
const dollarRegions = new Set(['CA', 'AU', 'NZ', 'SG', 'HK', 'MX', 'AR']);

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
    const appMax = appLocale.maximize();

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

    const deviceMax = deviceLocale.maximize();

    // Return device locale if language and script match
    if (
      appLocale.language === deviceLocale.language &&
      appMax.script === deviceMax.script
    ) {
      return deviceLocale.toString();
    }

    // Keep the script unless it matches both defaults
    const bareMax = new Intl.Locale(appLocale.language).maximize();
    const withRegionMax = new Intl.Locale(
      `${appLocale.language}-${deviceLocale.region}`,
    ).maximize();

    const script =
      appMax.script === bareMax.script && appMax.script === withRegionMax.script
        ? undefined
        : appMax.script;

    const combined = [appLocale.language, script, deviceLocale.region]
      .filter(Boolean)
      .join('-');

    return new Intl.Locale(combined).toString();
  } catch {
    return 'en';
  }
}

export function getCurrencyDisplay(locale: string) {
  try {
    const { region } = new Intl.Locale(locale);
    // A 3-digit region is an area (e.g. 419 Latin America), not a country, so
    // its local currency is unknown; keep USD marked.
    return region && (dollarRegions.has(region) || /^\d{3}$/u.test(region))
      ? 'symbol'
      : 'narrowSymbol';
  } catch {
    return 'narrowSymbol';
  }
}
