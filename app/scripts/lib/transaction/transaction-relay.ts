import { AuthorizationList } from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';

export type RelaySubmitRequest = {
  authorizationList?: AuthorizationList;
  data: Hex;
  maxFeePerGas: Hex;
  maxPriorityFeePerGas: Hex;
  to: Hex;
};

export type RelaySubmitResponse = {
  transactionHash: Hex;
};

export async function submitRelayTransaction(
  request: RelaySubmitRequest,
): Promise<RelaySubmitResponse> {
  const baseUrl = process.env.TRANSACTION_RELAY_API_URL as string;

  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Transaction relay submit failed with status: ${response.status} - ${errorBody}`,
    );
  }

  return await response.json();
}
