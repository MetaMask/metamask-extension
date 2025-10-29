import { Mockttp } from 'mockttp';

export async function serveTestSnapFromLocalhost(
  mockServer: Mockttp,
  port: number = 8081,
) {
  // Proxy all metamask.github.io requests to local server
  // This ensures the browser thinks it's visiting https://metamask.github.io (allowed origin) but actually gets content from localhost:port
  return mockServer
    .forGet(/^https:\/\/metamask\.github\.io\/.*$/u)
    .thenCallback(async (request) => {
      const url = new URL(request.url);

      // If it's the main page, serve from root
      let localPath = '';
      if (url.pathname.includes('test-snap')) {
        // For snap pages, serve from root of local server
        localPath = '/';
      } else {
        // For other assets, keep the original path
        localPath = url.pathname;
      }

      const localUrl = `http://localhost:${port}${localPath}${url.search}`;

      const response = await fetch(localUrl);
      const body = await response.text();

      return {
        statusCode: 200,
        body,
        headers: {
          'Content-Type':
            response.headers.get('content-type') || 'text/html; charset=utf-8',
        },
      };
    });
}

export async function mockTestSnapAndSite(
  mockServer: Mockttp,
  port: number = 8081,
) {
  const siteProxy = await serveTestSnapFromLocalhost(mockServer, port);

  return [siteProxy];
}
