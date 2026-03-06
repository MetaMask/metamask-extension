import getFetchWithTimeout from './fetch-with-timeout';

const fetchWithTimeout = getFetchWithTimeout();

/**
 * Makes a JSON RPC request to the given URL, with the given RPC method and params.
 *
 * @param {string} rpcUrl - The RPC endpoint URL to target.
 * @param {string} rpcMethod - The RPC method to request.
 * @param {Array<unknown>} [rpcParams] - The RPC method params.
 * @param {{ headers?: Record<string, string> }} [options] - Optional extra headers (e.g. Authorization).
 * @returns {Promise<unknown|undefined>} Returns the result of the RPC method call,
 * or throws an error in case of failure.
 */
export async function jsonRpcRequest(
  rpcUrl,
  rpcMethod,
  rpcParams = [],
  options = {},
) {
  let fetchUrl = rpcUrl;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
  };
  // Convert basic auth URL component to Authorization header
  const { origin, pathname, username, password, search } = new URL(rpcUrl);
  // URLs containing username and password needs special processing
  if (username && password) {
    const encodedAuth = Buffer.from(`${username}:${password}`).toString(
      'base64',
    );
    headers.Authorization = `Basic ${encodedAuth}`;
    fetchUrl = `${origin}${pathname}${search}`;
  }
  const jsonRpcResponse = await fetchWithTimeout(fetchUrl, {
    method: 'POST',
    body: JSON.stringify({
      id: Date.now().toString(),
      jsonrpc: '2.0',
      method: rpcMethod,
      params: rpcParams,
    }),
    headers,
    cache: 'default',
  }).then((httpResponse) => httpResponse.json());

  if (
    !jsonRpcResponse ||
    Array.isArray(jsonRpcResponse) ||
    typeof jsonRpcResponse !== 'object'
  ) {
    throw new Error(`RPC endpoint ${rpcUrl} returned non-object response.`);
  }
  const { error, result } = jsonRpcResponse;

  if (error) {
    throw new Error(error?.message || error);
  }
  return result;
}
