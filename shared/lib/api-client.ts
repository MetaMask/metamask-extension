import {
  HttpError,
  type V4MultiAccountTransactionsResponse,
} from '@metamask/core-backend';
import { ACCOUNTS_API_BASE_URL } from '../constants/accounts';
import { getCurrentLocale } from './translate';

export type Params = {
  accountAddresses: string[];
  networks?: string[];
  cursor?: string;
  limit?: number;
};

export type RequestOptions = {
  bearerToken?: string;
  signal?: AbortSignal;
};

export async function fetchV4MultiAccountTransactions(
  params: Params,
  requestOptions: RequestOptions = {},
): Promise<V4MultiAccountTransactionsResponse> {
  const { accountAddresses = [], networks = [], cursor, limit = 50 } = params;

  const url = new URL(`${ACCOUNTS_API_BASE_URL}/v4/multiaccount/transactions`);

  url.searchParams.set('limit', limit.toString());
  url.searchParams.set('includeTxMetadata', 'true');
  url.searchParams.set('lang', getCurrentLocale());

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

  const { bearerToken, signal } = requestOptions;
  const headers = new Headers();
  if (bearerToken) {
    headers.set('Authorization', `Bearer ${bearerToken}`);
  }

  const response = await fetch(url, {
    headers,
    signal,
  });

  if (!response.ok) {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      // Response body is not JSON or is empty, leave body as undefined
    }
    throw new HttpError(
      `HTTP ${response.status}: ${response.statusText}`,
      response.status,
      response.statusText,
      url.toString(),
      body,
    );
  }

  return response.json();
}
