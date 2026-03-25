type NormalizeOptions = {
  allowTrailingDecimal?: boolean;
};

const INPUT_SPACING_PATTERN = /[\s\u00A0\u202F']/gu;

const localeNumberSymbolsCache = new Map<string, LocaleNumberSymbols>();

type LocaleNumberSymbols = {
  decimal: string;
  group: string;
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

function countOccurrences(value: string, needle: string): number {
  if (!needle) {
    return 0;
  }
  return value.split(needle).length - 1;
}

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

  const symbols = getLocaleNumberSymbols(locale);
  const { decimal } = symbols;
  const { group } = symbols;
  const escapedDecimal = escapeRegExp(decimal);
  const escapedGroup = escapeRegExp(group);
  const allowedPattern = new RegExp(
    `^[0-9${escapedDecimal}${escapedGroup}]+$`,
    'u',
  );

  if (!allowedPattern.test(compact)) {
    return null;
  }

  const decimalCount = countOccurrences(compact, decimal);
  if (decimalCount > 1) {
    return null;
  }

  const [integerPart = '', fractionPart = ''] =
    decimalCount === 1 ? compact.split(decimal) : [compact, ''];
  if (
    group &&
    integerPart.includes(group) &&
    !new RegExp(
      allowTrailingDecimal
        ? `^\\d{1,3}(?:${escapedGroup}\\d{3})*(?:${escapedGroup}\\d{0,2})?$`
        : `^\\d{1,3}(?:${escapedGroup}\\d{3})*$`,
      'u',
    ).test(integerPart)
  ) {
    return null;
  }

  if (fractionPart.includes(group)) {
    return null;
  }

  let normalized = compact;
  if (group && group !== decimal) {
    normalized = normalized.split(group).join('');
  }
  if (decimal !== '.') {
    normalized = normalized.split(decimal).join('.');
  }

  if (normalized.startsWith('.')) {
    normalized = `0${normalized}`;
  }

  if (normalized === '') {
    return null;
  }

  if (!/^\d+(?:\.\d*)?$/u.test(normalized)) {
    return null;
  }

  if (!allowTrailingDecimal && normalized.endsWith('.')) {
    normalized = normalized.slice(0, -1);
  }

  return normalized;
}

export function parseLocalizedNumber(
  input: string,
  locale: string,
): number | null {
  const normalized = normalizeLocalizedNumberInput(input, locale);
  if (!normalized) {
    return null;
  }

  const parsed = Number.parseFloat(normalized);
  if (Number.isNaN(parsed) || !Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

export function toNormalizedFixedPrice(
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
