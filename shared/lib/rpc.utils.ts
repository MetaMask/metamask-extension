import getFetchWithTimeout from './fetch-with-timeout';

const fetchWithTimeout = getFetchWithTimeout();

const TOO_MANY_REQUESTS_STATUS = 429;

// -32005 is the EIP-1474 "limit exceeded" code. -32029 is returned by
// RouteMesh (lb.routeme.sh), which chainlist.org advertises for many chains.
const RATE_LIMIT_ERROR_CODES = [-32005, -32029];

/**
 * An error thrown by {@link jsonRpcRequest}, carrying the JSON-RPC error code
 * and HTTP status so callers can tell failure modes apart.
 */
export class JsonRpcRequestError extends Error {
  readonly code?: number;

  readonly httpStatus?: number;

  constructor(
    message: string,
    { code, httpStatus }: { code?: number; httpStatus?: number } = {},
  ) {
    super(message);
    this.name = 'JsonRpcRequestError';
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

/**
 * Determines whether a {@link jsonRpcRequest} failure was caused by the
 * provider throttling the request rather than by an unreachable or incorrect
 * endpoint.
 *
 * @param error - The error thrown by `jsonRpcRequest`.
 * @returns True if the provider rate limited the request.
 */
export function isRpcRateLimitError(error: unknown): boolean {
  if (!(error instanceof JsonRpcRequestError)) {
    return false;
  }

  return (
    error.httpStatus === TOO_MANY_REQUESTS_STATUS ||
    (error.code !== undefined && RATE_LIMIT_ERROR_CODES.includes(error.code))
  );
}

/**
 * Makes a JSON RPC request to the given URL, with the given RPC method and params.
 *
 * @param rpcUrl - The RPC endpoint URL to target.
 * @param rpcMethod - The RPC method to request.
 * @param rpcParams - The RPC method params.
 * @param options - Optional extra headers (e.g. Authorization).
 * @param options.headers - Optional HTTP headers to include in the request.
 * @returns Returns the result of the RPC method call,
 * or throws an error in case of failure.
 */
export async function jsonRpcRequest(
  rpcUrl: string,
  rpcMethod: string,
  rpcParams: unknown[] = [],
  options: { headers?: Record<string, string> } = {},
): Promise<unknown> {
  let fetchUrl = rpcUrl;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
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
  const httpResponse = await fetchWithTimeout(fetchUrl, {
    method: 'POST',
    body: JSON.stringify({
      id: Date.now().toString(),
      jsonrpc: '2.0',
      method: rpcMethod,
      params: rpcParams,
    }),
    headers,
    cache: 'default',
  });
  const { status: httpStatus } = httpResponse;
  // Throttling gateways often answer with a body that carries no JSON-RPC
  // error, so the status is the only signal available.
  const rateLimitError = () =>
    httpStatus === TOO_MANY_REQUESTS_STATUS
      ? new JsonRpcRequestError(
          `RPC endpoint ${rpcUrl} is rate limiting requests.`,
          { httpStatus },
        )
      : undefined;

  let jsonRpcResponse;
  try {
    jsonRpcResponse = await httpResponse.json();
  } catch (parseError) {
    throw rateLimitError() ?? parseError;
  }

  if (
    !jsonRpcResponse ||
    Array.isArray(jsonRpcResponse) ||
    typeof jsonRpcResponse !== 'object'
  ) {
    throw (
      rateLimitError() ??
      new Error(`RPC endpoint ${rpcUrl} returned non-object response.`)
    );
  }
  const { error, result } = jsonRpcResponse as {
    error?: { message?: string; code?: number } | string;
    result?: unknown;
  };

  if (error) {
    const isErrorObject = typeof error === 'object';

    throw new JsonRpcRequestError(
      isErrorObject ? (error.message ?? JSON.stringify(error)) : error,
      { code: isErrorObject ? error.code : undefined, httpStatus },
    );
  }
  return result;
}
