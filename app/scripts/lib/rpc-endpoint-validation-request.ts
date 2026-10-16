import {
  getRpcValidationFetchUrl,
  RPC_VALIDATION_REQUEST_ID,
  type RpcValidationResponse,
} from '../../../shared/lib/rpc-endpoint-validation';

const MAX_RESPONSE_BYTES = 64 * 1024;

/**
 * Send the broker's fixed chain-ID request without browser cookies. It runs in
 * its own dependency-free tab; it never runs inside the background or UI realm.
 *
 * @param rpcUrl - The user-selected RPC endpoint URL.
 * @returns A chain ID or sanitized error metadata, never the raw response.
 */
export async function requestRpcChainId(
  rpcUrl: string,
): Promise<RpcValidationResponse> {
  const url = new URL(rpcUrl);
  const fetchUrl = getRpcValidationFetchUrl(rpcUrl);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (url.username || url.password) {
    const credentials = new TextEncoder().encode(
      `${decodeURIComponent(url.username)}:${decodeURIComponent(url.password)}`,
    );
    headers.Authorization = `Basic ${btoa(
      Array.from(credentials, (byte) => String.fromCharCode(byte)).join(''),
    )}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(fetchUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        id: RPC_VALIDATION_REQUEST_ID,
        jsonrpc: '2.0',
        method: 'eth_chainId',
        params: [],
      }),
      credentials: 'omit',
      redirect: 'error',
      referrerPolicy: 'no-referrer',
      cache: 'no-store',
      signal: controller.signal,
    });
    const httpStatus = response.status;
    if (!response.ok || !response.body) {
      return { error: { httpStatus } };
    }

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      size += value.byteLength;
      if (size > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        return { error: { httpStatus } };
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const payload: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (
      payload === null ||
      typeof payload !== 'object' ||
      Array.isArray(payload)
    ) {
      return { error: { httpStatus } };
    }
    const { id, jsonrpc, result, error } = payload as {
      id?: unknown;
      jsonrpc?: unknown;
      result?: unknown;
      error?: { code?: unknown } | null;
    };
    if (error) {
      return {
        error: {
          httpStatus,
          ...(typeof error.code === 'number' ? { code: error.code } : {}),
        },
      };
    }
    if (
      id !== RPC_VALIDATION_REQUEST_ID ||
      jsonrpc !== '2.0' ||
      typeof result !== 'string' ||
      result.length > 66 ||
      !/^0x(?:0|[1-9a-f][0-9a-f]*)$/iu.test(result)
    ) {
      return { error: { httpStatus } };
    }
    return { chainId: result.toLowerCase() };
  } catch {
    return { error: {} };
  } finally {
    clearTimeout(timeout);
  }
}
