import type { V4MultiAccountTransactionsResponse } from './types';

const API_BASE_URL = 'https://accounts.api.cx.metamask.io';

type Params = {
  accountAddresses: string[];
  cursor?: string;
  limit?: number;
  networks?: string[];
};

// Vanilla fetch function that can be shared across clients

export async function fetchV4MultiAccountTransactions(params: Params) {
  const { accountAddresses = [], cursor, limit = 50, networks = [] } = params;

  const searchParams = new URLSearchParams();
  searchParams.append('limit', limit.toString());
  searchParams.append('includeTxMetadata', 'true');

  const formattedAddresses = accountAddresses.map(
    (addr) => `eip155:0:${addr.toLowerCase()}`,
  );
  searchParams.append('accountAddresses', formattedAddresses.join(','));

  if (networks.length > 0) {
    searchParams.append('networks', networks.join(','));
  }

  if (cursor) {
    searchParams.append('cursor', cursor);
  }

  const url = `${API_BASE_URL}/v4/multiaccount/transactions?${searchParams.toString()}`;

  return simpleFetch<V4MultiAccountTransactionsResponse>(url);
}

async function simpleFetch<TResponse>(url: string) {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json() as TResponse;
}
