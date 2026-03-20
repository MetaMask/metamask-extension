type NormalizeOptions = {
  allowTrailingDecimal?: boolean;
};

const INPUT_SPACING_PATTERN = /[\s\u00A0\u202F']/gu;

const localeNumberSymbolsCache = new Map<string, LocaleNumberSymbols>();

type LocaleNumberSymbols = {
  decimal: string;
  group: string;
};

function getLocaleNumberSymbols(locale: string): LocaleNumberSymbols {
  const cached = localeNumberSymbolsCache.get(locale);
  if (cached) {
    return cached;
  }

  const parts = new Intl.NumberFormat(locale).formatToParts(12345.6);
  const decimal = parts.find((part) => part.type === 'decimal')?.value ?? '.';
  const group = parts.find((part) => part.type === 'group')?.value ?? ',';

  const symbols = { decimal, group };
  localeNumberSymbolsCache.set(locale, symbols);
  return symbols;
}

function looksLikeGroupedThousands(value: string, separator: string): boolean {
  const escapedSeparator = separator.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  return new RegExp(`^\\d{1,3}(?:${escapedSeparator}\\d{3})+$`, 'u').test(
    value,
  );
}

function inferDecimalSeparator(
  value: string,
  symbols: LocaleNumberSymbols,
): string | null {
  const commaCount = (value.match(/,/gu) || []).length;
  const dotCount = (value.match(/\./gu) || []).length;

  if (commaCount > 0 && dotCount > 0) {
    return value.lastIndexOf(',') > value.lastIndexOf('.') ? ',' : '.';
  }

  if (commaCount === 0 && dotCount === 0) {
    return null;
  }

  const separator = commaCount > 0 ? ',' : '.';
  const separatorCount = commaCount > 0 ? commaCount : dotCount;

  if (separator === symbols.decimal) {
    return separator;
  }

  if (separator === symbols.group) {
    if (looksLikeGroupedThousands(value, separator)) {
      return null;
    }

    if (separatorCount > 1) {
      return null;
    }

    const digitsAfter = value.length - value.lastIndexOf(separator) - 1;
    return digitsAfter <= 2 ? separator : null;
  }

  return separatorCount === 1 ? separator : null;
}

export function normalizeLocalizedNumberInput(
  input: string,
  locale: string,
  options: NormalizeOptions = {},
): string | null {
  const { allowTrailingDecimal = false } = options;

  const trimmed = input.trim();
  if (trimmed === '') {
    return '';
  }

  const compact = trimmed.replace(INPUT_SPACING_PATTERN, '');
  if (compact === '') {
    return '';
  }

  if (/[^0-9.,]/u.test(compact)) {
    return null;
  }

  const symbols = getLocaleNumberSymbols(locale);
  const decimalSeparator = inferDecimalSeparator(compact, symbols);

  let canonical = '';
  let sawDecimal = false;

  for (const character of compact) {
    if (/\d/u.test(character)) {
      canonical += character;
      continue;
    }

    if (decimalSeparator && character === decimalSeparator && !sawDecimal) {
      if (canonical === '') {
        canonical = '0';
      }
      canonical += '.';
      sawDecimal = true;
      continue;
    }

    if (
      character === ',' ||
      character === '.' ||
      character === symbols.group ||
      character === symbols.decimal
    ) {
      continue;
    }

    return null;
  }

  if (canonical === '') {
    return null;
  }

  if (!allowTrailingDecimal && canonical.endsWith('.')) {
    canonical = canonical.slice(0, -1);
  }

  if (
    allowTrailingDecimal &&
    decimalSeparator &&
    compact.endsWith(decimalSeparator) &&
    !canonical.endsWith('.')
  ) {
    canonical += '.';
  }

  return canonical;
}

export function parseLocalizedNumber(
  input: string,
  locale: string,
): number | null {
  const canonical = normalizeLocalizedNumberInput(input, locale);
  if (!canonical) {
    return null;
  }

  const parsed = Number.parseFloat(canonical);
  if (Number.isNaN(parsed) || !Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

export function toCanonicalFixedPrice(
  input: string,
  locale: string,
  fractionDigits = 2,
): string | null {
  const value = parseLocalizedNumber(input, locale);

  if (value === null || value <= 0) {
    return null;
  }

  return value.toFixed(fractionDigits);
}
