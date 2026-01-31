import type { V4MultiAccountTransactionsResponse } from './types';

const API_BASE_URL = 'https://accounts.api.cx.metamask.io';

type Params = {
  accountAddresses: string[];
  networks?: string[];
  cursor?: string;
  limit?: number;
};

// THIS can be in a shared package
export async function fetchV4MultiAccountTransactions(
  params: Params,
): Promise<V4MultiAccountTransactionsResponse> {
  const { accountAddresses = [], networks = [], cursor, limit = 50 } = params;

  const url = new URL(`${API_BASE_URL}/v4/multiaccount/transactions`);

  url.searchParams.set('limit', limit.toString());
  url.searchParams.set('includeTxMetadata', 'true');
  url.searchParams.set('lang', 'en'); // TODO: locale

  const formattedAddresses = accountAddresses.map(
    (addr) => `eip155:0:${addr.toLowerCase()}`,
  );
  url.searchParams.set('accountAddresses', formattedAddresses.join(','));

  if (networks.length > 0) {
    url.searchParams.set('networks', networks.join(','));
  }

  if (cursor) {
    url.searchParams.set('cursor', cursor);
  }

  const response = await fetch(url);
  return response.json();
}
