import { Mockttp } from 'mockttp';
import { mockSimpleKeyringSnap } from '../../mock-response-data/snaps/snap-binary-mocks';

/** Disables rewards flags that add background work during snap account E2E setup. */
export const SNAP_SIMPLE_KEYRING_E2E_MANIFEST_FLAGS = {
  remoteFeatureFlags: {
    rewardsEnabled: { enabled: false, minimumVersion: '13.32.0' },
    rewardsOnboardingEnabled: { enabled: false, minimumVersion: '13.32.0' },
  },
};

export async function serveSnapKeyRingFromLocalhost(
  mockServer: Mockttp,
  port: number = 8080,
) {
  // Proxy all metamask.github.io requests to local server
  // This ensures the browser thinks it's visiting https://metamask.github.io (allowed origin) but actually gets content from localhost:port
  // https://github.com/MetaMask/snap-simple-keyring/blob/40966a4363ff981bbb7d5e3bd62ad74a9fafc850/packages/snap/snap.manifest.json#L22
  return mockServer
    .forGet(/^https:\/\/metamask\.github\.io\/.*$/u)
    .thenCallback(async (request) => {
      const url = new URL(request.url);

      // If it's the main page, serve from root
      let localPath = '';
      if (url.pathname.includes('snap-simple-keyring')) {
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

export async function mockSnapSimpleKeyringAndSite(
  mockServer: Mockttp,
  port: number = 8080,
) {
  return [
    await mockSimpleKeyringSnap(mockServer),
    await serveSnapKeyRingFromLocalhost(mockServer, port),
  ];
}
