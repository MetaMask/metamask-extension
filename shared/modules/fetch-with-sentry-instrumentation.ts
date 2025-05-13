import { startSpan, getCurrentScope } from '@sentry/browser';

export function getFetchWithSentryInstrumentation(
  fetchFunction: (url: RequestInfo, opts?: RequestInit) => Promise<Response>,
) {
  return async (
    inputUrl: Parameters<typeof fetchFunction>[0],
    opts?: Parameters<typeof fetchFunction>[1],
  ) => {
    const url =
      typeof inputUrl === 'string'
        ? inputUrl
        : inputUrl.toString() || String(inputUrl);
    const { method = 'GET' } = opts ?? {};

    return startSpan(
      { op: 'http.client', name: `${method} ${url}` },
      async (span) => {
        const response = await fetchFunction(url, {
          method,
          ...opts,
        });

        // Do not create spans for outgoing requests to a 'sentry.io' domain.
        if (url.match(/^https?:\/\/([\w\d.@-]+\.)?sentry\.io(\/|$)/u)) {
          return response;
        }

        const parsedURL = new URL(url, globalThis.location?.origin);

        span.setAttributes({
          'http.request.method': method,
          'server.address': parsedURL.hostname,
          'server.port': parsedURL.port || undefined,
          'http.response.status_code': response.status,
        });
        const contentLength = response.headers.get('content-length');
        if (contentLength) {
          span.setAttribute(
            'http.response_content_length',
            Number(contentLength),
          );
        }

        const cloudflareRayId =
          response.headers?.get('CF-Ray') ?? response.headers?.get('cf_ray');
        if (cloudflareRayId !== null) {
          span.setAttribute('CF-Ray', cloudflareRayId);
          const scope = getCurrentScope();
          scope?.setTag('CF-Ray', cloudflareRayId);
        }

        return response;
      },
    );
  };
}
