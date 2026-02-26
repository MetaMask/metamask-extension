import { Mockttp } from 'mockttp';
import { mockAccountAbstractionKeyringSnap } from '../snap-binary-mocks';

export async function serveSnapAccountAbstractionKeyRingFromLocalhost(
  mockServer: Mockttp,
  port: number = 8080,
) {
  // Proxy all metamask.github.io requests to local server
  // This ensures the browser thinks it's visiting https://metamask.github.io (allowed origin) but actually gets content from localhost:port
  // https://github.com/MetaMask/snap-account-abstraction-keyring/blob/main/packages/snap/snap.manifest.json
  return mockServer
    .forGet(/^https:\/\/metamask\.github\.io\/.*$/u)
    .thenCallback(async (request) => {
      const url = new URL(request.url);

      // If it's the main page, serve from root
      let localPath = '';
      if (url.pathname.includes('snap-account-abstraction-keyring')) {
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

export async function mockSnapAccountAbstractionKeyRingAndSite(
  mockServer: Mockttp,
  port: number = 8080,
) {
  const accountAbstractionKeyring =
    await mockAccountAbstractionKeyringSnap(mockServer);
  const siteProxy = await serveSnapAccountAbstractionKeyRingFromLocalhost(
    mockServer,
    port,
  );

  return [accountAbstractionKeyring, siteProxy];
}
