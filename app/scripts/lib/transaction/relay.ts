import { TransactionParams } from "@metamask/transaction-controller";
import { Hex } from "@metamask/utils";

const BASE_URL = process.env.TRANSACTION_RELAY_API_URL;
const URL_SUBMIT = `${BASE_URL}/`;

export type RelaySubmitRequest = TransactionParams;

export type RelaySubmitResponse = {
  transactionHash: Hex;
}

export async function submitRelayTransaction(
  request: RelaySubmitRequest,
): Promise<RelaySubmitResponse> {
  const response  = await fetch(URL_SUBMIT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Transaction relay submit failed with status: ${response.status} - ${errorBody}`);
  }

  return await response.json();
}
