import { Mockttp } from 'mockttp';

function getContentType(path: string): string {
  if (path.endsWith('.js')) {
    return 'application/javascript';
  }
  if (path.endsWith('.css')) {
    return 'text/css';
  }
  if (path.endsWith('.json')) {
    return 'application/json';
  }
  if (path.endsWith('.ico')) {
    return 'image/x-icon';
  }
  if (path.endsWith('.png')) {
    return 'image/png';
  }
  if (path.endsWith('.svg')) {
    return 'image/svg+xml';
  }
  return 'text/html; charset=utf-8';
}

export async function serveTestSnapsFromLocalhost(
  mockServer: Mockttp,
  port: number = 8080,
) {
  // Proxy all metamask.github.io requests to local server
  // This ensures the browser thinks it's visiting https://metamask.github.io (allowed origin) but actually gets content from localhost:port
  return mockServer
    .forGet(/^https:\/\/metamask\.github\.io\/.*test-snaps.*$/u)
    .thenCallback(async (request) => {
      const url = new URL(request.url);

      // Handle test-snaps site path mapping
      let localPath = '';
      if (url.pathname.includes('test-snaps')) {
        // Handle two URL patterns:
        // 1. With version: /snaps/test-snaps/2.28.1/main.js -> /main.js
        // 2. Without version: /snaps/test-snaps/main.js -> /main.js
        // 3. Main page: /snaps/test-snaps/2.28.1 -> /

        // First try pattern with version number
        let match = url.pathname.match(/\/snaps\/test-snaps\/[\d.]+(\/.+)?$/u);

        if (match?.[1]) {
          // Asset path found after version number: /snaps/test-snaps/2.28.1/main.js -> /main.js
          localPath = match[1];
        } else if (match && !match[1]) {
          // Main page with version: /snaps/test-snaps/2.28.1 -> /
          localPath = '/';
        } else {
          // Try pattern without version number: /snaps/test-snaps/main.js -> /main.js
          match = url.pathname.match(/\/snaps\/test-snaps\/(.+)$/u);
          if (match?.[1]) {
            localPath = `/${match[1]}`;
          } else {
            // Fallback to root
            localPath = '/';
          }
        }
      } else {
        // For other assets, keep the original path
        localPath = url.pathname;
      }

      const localUrl = `http://localhost:${port}${localPath}${url.search}`;

      try {
        const response = await fetch(localUrl);

        if (!response.ok) {
          return {
            statusCode: response.status,
            body: `File not found: ${localPath}`,
            headers: {
              'Content-Type': 'text/plain',
            },
          };
        }

        const contentType =
          response.headers.get('content-type') || getContentType(localPath);

        // Handle binary vs text content
        const isText =
          contentType.startsWith('text/') ||
          contentType.includes('javascript') ||
          contentType.includes('json') ||
          contentType.includes('svg');

        const body = isText
          ? await response.text()
          : await response.arrayBuffer();

        return {
          statusCode: 200,
          [isText ? 'body' : 'rawBody']: body,
          headers: {
            'Content-Type': contentType,
          },
        };
      } catch (error) {
        return {
          statusCode: 500,
          body: `Error fetching file: ${error instanceof Error ? error.message : String(error)}`,
          headers: {
            'Content-Type': 'text/plain',
          },
        };
      }
    });
}

export async function mockTestSnapsSite(
  mockServer: Mockttp,
  port: number = 8080,
) {
  const siteProxy = await serveTestSnapsFromLocalhost(mockServer, port);

  return [siteProxy];
}
