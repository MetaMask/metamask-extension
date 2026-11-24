import { BaseUrl } from '../../../../shared/constants/urls';

/**
 * Builds the Portfolio `/buy` URL that receives the original link params when
 * the in-app buy flow falls back to the web app.
 *
 * @param query - The deep link query params to forward.
 * @returns The Portfolio buy URL.
 */
export function getPortfolioBuyUrl(query: URLSearchParams): string {
  const buyUrl = new URL('/buy', BaseUrl.Portfolio);
  buyUrl.search = query.toString();
  return buyUrl.toString();
}
