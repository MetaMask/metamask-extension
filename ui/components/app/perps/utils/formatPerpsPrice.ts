/**
 * Re-exports the perps price formatter from shared so UI components can import
 * from a relative path without needing to reach into shared/ directly.
 */
export {
  formatPerpsPrice,
  PRICE_RANGES_UNIVERSAL,
  type PerpsPriceRange,
} from '../../../../../shared/lib/perps-formatters';
