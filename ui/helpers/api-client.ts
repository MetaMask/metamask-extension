import type { V4MultiAccountTransactionsResponse } from './types';

const API_BASE_URL = 'https://accounts.api.cx.metamask.io';

type Params = {
  accountIds: string[];
  cursor?: string;
  limit?: number;
  networks?: string[];
};

// Vanilla fetch function that can be shared across clients

export async function fetchV4MultiAccountTransactions(params: Params) {
  const { accountIds, cursor, limit = 50, networks } = params;

  if (!accountIds || accountIds.length === 0) {
    throw new Error('No account addresses provided');
  }

  const formattedAddresses = accountIds.map(
    (addr) => `eip155:0:${addr.toLowerCase()}`,
  );

  const searchParams = new URLSearchParams();
  searchParams.append('accountAddresses', formattedAddresses.join(','));
  searchParams.append('limit', limit.toString());
  searchParams.append('includeTxMetadata', 'true');

  if (cursor) {
    searchParams.append('cursor', cursor);
  }

  if (networks && networks.length > 0) {
    searchParams.append('networks', networks.join(','));
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
