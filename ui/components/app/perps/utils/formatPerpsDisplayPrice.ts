import {
  formatPerpsFiat,
  PRICE_RANGES_MINIMAL_VIEW,
  PRICE_RANGES_UNIVERSAL,
} from '../../../../../shared/lib/perps-formatters';

export function parsePerpsDisplayPrice(
  value: string | number | null | undefined,
): number {
  return Number.parseFloat(String(value ?? '').replace(/[$,]/gu, ''));
}

export function normalizePerpsDisplayPrice(value: string | number): number {
  return typeof value === 'number' ? value : parsePerpsDisplayPrice(value);
}

export function formatPerpsFiatMinimal(value: string | number): string {
  return formatPerpsFiat(normalizePerpsDisplayPrice(value), {
    ranges: PRICE_RANGES_MINIMAL_VIEW,
  });
}

export function formatPerpsFiatUniversal(value: string | number): string {
  return formatPerpsFiat(normalizePerpsDisplayPrice(value), {
    ranges: PRICE_RANGES_UNIVERSAL,
  });
}
