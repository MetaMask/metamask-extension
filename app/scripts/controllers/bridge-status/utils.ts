import { BRIDGE_CLIENT_ID } from '../../../../shared/constants/bridge';
import fetchWithCache from '../../../../shared/lib/fetch-with-cache';
import {
  StatusResponse,
  StatusRequestWithSrcTxHash,
  StatusRequestDto,
} from '../../../../shared/types/bridge-status';
import type { Quote } from '../../../../shared/types/bridge';
import { validateResponse, validators } from './validators';
import { BRIDGE_STATUS_BASE_URL } from './constants';

const CLIENT_ID_HEADER = { 'X-Client-Id': BRIDGE_CLIENT_ID };

export const getStatusRequestDto = (
  statusRequest: StatusRequestWithSrcTxHash,
): StatusRequestDto => {
  const { quote, ...statusRequestNoQuote } = statusRequest;

  const statusRequestNoQuoteFormatted = Object.fromEntries(
    Object.entries(statusRequestNoQuote).map(([key, value]) => [
      key,
      value?.toString(),
    ]),
  ) as unknown as Omit<StatusRequestDto, 'requestId'>;

  const requestId: { requestId: string } | Record<string, never> =
    quote?.requestId ? { requestId: quote.requestId } : {};

  return {
    ...statusRequestNoQuoteFormatted,
    ...requestId,
  };
};

export const fetchBridgeTxStatus = async (
  statusRequest: StatusRequestWithSrcTxHash,
) => {
  const statusRequestDto = getStatusRequestDto(statusRequest);
  const params = new URLSearchParams(statusRequestDto);

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

export const getStatusRequestWithSrcTxHash = (
  quote: Quote,
  srcTxHash: string,
): StatusRequestWithSrcTxHash => {
  return {
    bridgeId: quote.bridgeId,
    srcTxHash,
    bridge: quote.bridges[0],
    srcChainId: quote.srcChainId,
    destChainId: quote.destChainId,
    quote,
    refuel: Boolean(quote.refuel),
  };
};
