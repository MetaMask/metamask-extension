import {
  BRIDGE_API_BASE_URL,
  BRIDGE_CLIENT_ID,
} from '../../../../shared/constants/bridge';
import fetchWithCache from '../../../../shared/lib/fetch-with-cache';
import {
  StatusResponse,
  StatusRequest,
} from '../../../../shared/types/bridge-status';
import { validateResponse, validators } from './validators';

const CLIENT_ID_HEADER = { 'X-Client-Id': BRIDGE_CLIENT_ID };

export const BRIDGE_STATUS_BASE_URL = `${BRIDGE_API_BASE_URL}/getTxStatus`;

export const fetchBridgeTxStatus = async (statusRequest: StatusRequest) => {
  // Assemble params
  const { quote, ...statusRequestNoQuote } = statusRequest;
  const statusRequestNoQuoteFormatted = Object.fromEntries(
    Object.entries(statusRequestNoQuote).map(([key, value]) => [
      key,
      value.toString(),
    ]),
  );
  const params = new URLSearchParams(statusRequestNoQuoteFormatted);

  // Fetch
  const url = `${BRIDGE_STATUS_BASE_URL}?${params.toString()}`;

  const rawTxStatus = await fetchWithCache({
    url,
    fetchOptions: { method: 'GET', headers: CLIENT_ID_HEADER },
    cacheOptions: { cacheRefreshTime: 0 },
    functionName: 'fetchBridgeTxStatus',
  });

  // Validate
  const isValid = validateResponse<StatusResponse, unknown>(
    validators,
    rawTxStatus,
    BRIDGE_STATUS_BASE_URL,
  );
  if (!isValid) {
    throw new Error('Invalid response from bridge');
  }

  // Return
  return rawTxStatus;
};
