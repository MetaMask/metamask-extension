import { CompletedRequest, Mockttp } from 'mockttp';
import { REWARDS_API_URL } from '../../../../shared/constants/rewards';
import { mockSimpleKeyringSnap } from '../../mock-response-data/snaps/snap-binary-mocks';

/**
 * Prevents rewards silent authentication from competing with Snap dialogs.
 *
 * The response has one explicit opt-out result per requested address. An empty
 * result lets the rewards controller proceed to silent authentication.
 *
 * @param mockServer - The E2E mock server.
 */
export async function mockRewardsOptOut(mockServer: Mockttp) {
  const mockOptInStatus = async (request: CompletedRequest) => {
    const body = (await request.body.getJson()) as {
      addresses?: unknown[];
    };
    const addressCount = body.addresses?.length ?? 0;

    return {
      statusCode: 200,
      json: {
        ois: Array(addressCount).fill(false),
        sids: Array(addressCount).fill(null),
      },
    };
  };

  return await Promise.all(
    [REWARDS_API_URL.UAT, REWARDS_API_URL.PRD].map((apiUrl) =>
      mockServer
        .forPost(`${apiUrl}/public/rewards/ois`)
        .always()
        .thenCallback(mockOptInStatus),
    ),
  );
}

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
