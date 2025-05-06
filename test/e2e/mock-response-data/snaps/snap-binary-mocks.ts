import fs from 'fs';
import { Mockttp } from 'mockttp';

export async function mockBip32Snap(mockServer: Mockttp) {
  const SNAP_PATH =
    'test/e2e/mock-response-data/snaps/bip32-example-snap-2.3.0.txt';
  return await mockServer
    .forGet(
      'https://registry.npmjs.org/@metamask/bip32-example-snap/-/bip32-example-snap-2.3.0.tgz',
    )
    .thenCallback(() => {
      return {
        status: 200,
        rawBody: fs.readFileSync(SNAP_PATH),
        headers: {
          'Accept-Ranges': 'bytes',
          'Content-Length': '72040',
          'Content-Type': 'application/octet-stream',
          Etag: '"f6aefd54643480c1b753fa4244a537cf"',
          Vary: 'Accept-Encoding',
        },
      };
    });
}

export async function mockBip44Snap(mockServer: Mockttp) {
  const SNAP_PATH =
    'test/e2e/mock-response-data/snaps/bip44-example-snap-2.2.0.txt';
  return await mockServer
    .forGet(
      'https://registry.npmjs.org/@metamask/bip44-example-snap/-/bip44-example-snap-2.2.0.tgz',
    )
    .thenCallback(() => {
      return {
        status: 200,
        rawBody: fs.readFileSync(SNAP_PATH),
        headers: {
          'Accept-Ranges': 'bytes',
          'Content-Length': '78008',
          'Content-Type': 'application/octet-stream',
          Etag: '"2868a47b39a090ac18044548fb6fa37e"',
          Vary: 'Accept-Encoding',
        },
      };
    });
}

export async function mockClientStatusSnap(mockServer: Mockttp) {
  const SNAP_PATH =
    'test/e2e/mock-response-data/snaps/client-status-example-snap-1.0.3.txt';
  return await mockServer
    .forGet(
      'https://registry.npmjs.org/@metamask/client-status-example-snap/-/client-status-example-snap-1.0.3.tgz',
    )
    .thenCallback(() => {
      return {
        status: 200,
        rawBody: fs.readFileSync(SNAP_PATH),
        headers: {
          'Accept-Ranges': 'bytes',
          'Content-Length': '11873',
          'Content-Type': 'application/octet-stream',
          Etag: '"84e43175ffad7735148282c566b2a933"',
          Vary: 'Accept-Encoding',
        },
      };
    });
}

export async function mockCronjobExampleSnap(mockServer: Mockttp) {
  const SNAP_PATH =
    'test/e2e/mock-response-data/snaps/cronjob-example-snap-3.0.0.txt';
  return await mockServer
    .forGet(
      'https://registry.npmjs.org/@metamask/cronjob-example-snap/-/cronjob-example-snap-3.0.0.tgz',
    )
    .thenCallback(() => {
      return {
        status: 200,
        rawBody: fs.readFileSync(SNAP_PATH),
        headers: {
          'Accept-Ranges': 'bytes',
          'Content-Length': '14697',
          'Content-Type': 'application/octet-stream',
          Etag: '"19f44e9e1a7ae62f4d036c5b76d585b7"',
          Vary: 'Accept-Encoding',
        },
      };
    });
}

export async function mockEthereumProviderExampleSnap(mockServer: Mockttp) {
  const SNAP_PATH =
    'test/e2e/mock-response-data/snaps/ethereum-provider-example-snap-2.2.1.txt';
  return await mockServer
    .forGet(
      'https://registry.npmjs.org/@metamask/ethereum-provider-example-snap/-/ethereum-provider-example-snap-2.2.1.tgz',
    )
    .thenCallback(() => {
      return {
        status: 200,
        rawBody: fs.readFileSync(SNAP_PATH),
        headers: {
          'Accept-Ranges': 'bytes',
          'Content-Length': '13766',
          'Content-Type': 'application/octet-stream',
          Etag: '"2334ecd5d580bb940c25991210f3f063"',
          Vary: 'Accept-Encoding',
        },
      };
    });
}

export async function mockGetFileSnap(mockServer: Mockttp) {
  const SNAP_PATH =
    'test/e2e/mock-response-data/snaps/get-file-example-snap-1.1.3.txt';
  return await mockServer
    .forGet(
      'https://registry.npmjs.org/@metamask/get-file-example-snap/-/get-file-example-snap-1.1.3.tgz',
    )
    .thenCallback(() => {
      return {
        status: 200,
        rawBody: fs.readFileSync(SNAP_PATH),
        headers: {
          'Accept-Ranges': 'bytes',
          'Content-Length': '12290',
          'Content-Type': 'application/octet-stream',
          Etag: '"8135e843e047041b4bc331ff81490d1f"',
          Vary: 'Accept-Encoding',
        },
      };
    });
}

export async function mockImagesExampleSnap(mockServer: Mockttp) {
  const SNAP_PATH =
    'test/e2e/mock-response-data/snaps/images-example-snap-1.1.1.txt';
  return await mockServer
    .forGet(
      'https://registry.npmjs.org/@metamask/images-example-snap/-/images-example-snap-1.1.1.tgz',
    )
    .thenCallback(() => {
      return {
        status: 200,
        rawBody: fs.readFileSync(SNAP_PATH),
        headers: {
          'Accept-Ranges': 'bytes',
          'Content-Length': '21020',
          'Content-Type': 'application/octet-stream',
          Etag: '"f6d5fc4b24eb5e111ff7fbd88a29f305"',
          Vary: 'Accept-Encoding',
        },
      };
    });
}

export async function mockLifecycleHooksSnap(mockServer: Mockttp) {
  const SNAP_PATH =
    'test/e2e/mock-response-data/snaps/lifecycle-hooks-example-snap-2.1.3.txt';
  return await mockServer
    .forGet(
      'https://registry.npmjs.org/@metamask/lifecycle-hooks-example-snap/-/lifecycle-hooks-example-snap-2.1.3.tgz',
    )
    .thenCallback(() => {
      return {
        status: 200,
        rawBody: fs.readFileSync(SNAP_PATH),
        headers: {
          'Accept-Ranges': 'bytes',
          'Content-Length': '10583',
          'Content-Type': 'application/octet-stream',
          Etag: '"78ffe86713ef9421d920913e2dedfad9"',
          Vary: 'Accept-Encoding',
        },
      };
    });
}

export async function mockLocalizationExampleSnap(mockServer: Mockttp) {
  const SNAP_PATH =
    'test/e2e/mock-response-data/snaps/localization-example-snap-1.1.4.txt';
  return await mockServer
    .forGet(
      'https://registry.npmjs.org/@metamask/localization-example-snap/-/localization-example-snap-1.1.4.tgz',
    )
    .thenCallback(() => {
      return {
        status: 200,
        rawBody: fs.readFileSync(SNAP_PATH),
        headers: {
          'Accept-Ranges': 'bytes',
          'Content-Length': '13008',
          'Content-Type': 'application/octet-stream',
          Etag: '"82048841ad547da41853302e04c4998b"',
          Vary: 'Accept-Encoding',
        },
      };
    });
}

export async function mockLookupSnap(mockServer: Mockttp) {
  const SNAP_PATH =
    'test/e2e/mock-response-data/snaps/name-lookup-example-snap-3.1.1.txt';
  return await mockServer
    .forGet(
      'https://registry.npmjs.org/@metamask/name-lookup-example-snap/-/name-lookup-example-snap-3.1.1.tgz',
    )
    .thenCallback(() => {
      return {
        status: 200,
        rawBody: fs.readFileSync(SNAP_PATH),
        headers: {
          'Accept-Ranges': 'bytes',
          'Content-Length': '7155',
          'Content-Type': 'application/octet-stream',
          Etag: '"61ad04c85067c395d930a0f3f75cb501"',
          Vary: 'Accept-Encoding',
        },
      };
    });
}

export async function mockManageStateSnap(mockServer: Mockttp) {
  const SNAP_PATH =
    'test/e2e/mock-response-data/snaps/manage-state-example-snap-3.0.0.txt';
  return await mockServer
    .forGet(
      'https://registry.npmjs.org/@metamask/manage-state-example-snap/-/manage-state-example-snap-3.0.0.tgz',
    )
    .thenCallback(() => {
      return {
        status: 200,
        rawBody: fs.readFileSync(SNAP_PATH),
        headers: {
          'Accept-Ranges': 'bytes',
          'Content-Length': '13369',
          'Content-Type': 'application/octet-stream',
          Etag: '"ebf53ab08e421cb48ca87a46a36453f4"',
          Vary: 'Accept-Encoding',
        },
      };
    });
}

export async function mockNetworkExampleSnap(mockServer: Mockttp) {
  const SNAP_PATH =
    'test/e2e/mock-response-data/snaps/network-example-snap-2.1.3.txt';
  return await mockServer
    .forGet(
      'https://registry.npmjs.org/@metamask/network-example-snap/-/network-example-snap-2.1.3.tgz',
    )
    .thenCallback(() => {
      return {
        status: 200,
        rawBody: fs.readFileSync(SNAP_PATH),
        headers: {
          'Accept-Ranges': 'bytes',
          'Content-Length': '12674',
          'Content-Type': 'application/octet-stream',
          Etag: '"539039fd545d2040fd2a43e5eb7950c2"',
          Vary: 'Accept-Encoding',
        },
      };
    });
}

export async function mockNotificationExampleSnap(mockServer: Mockttp) {
  const SNAP_PATH =
    'test/e2e/mock-response-data/snaps/notification-example-snap-2.3.0.txt';
  return await mockServer
    .forGet(
      'https://registry.npmjs.org/@metamask/notification-example-snap/-/notification-example-snap-2.3.0.tgz',
    )
    .thenCallback(() => {
      return {
        status: 200,
        rawBody: fs.readFileSync(SNAP_PATH),
        headers: {
          'Accept-Ranges': 'bytes',
          'Content-Length': '13246',
          'Content-Type': 'application/octet-stream',
          Etag: '"147c9a644216eb5ffb90fca4dabb4a2a"',
          Vary: 'Accept-Encoding',
        },
      };
    });
}

export async function mockSimpleKeyringSnap(mockServer: Mockttp) {
  const SNAP_PATH =
    'test/e2e/mock-response-data/snaps/snap-simple-keyring-snap-1.1.6.txt';
  return await mockServer
    .forGet(
      'https://registry.npmjs.org/@metamask/snap-simple-keyring-snap/-/snap-simple-keyring-snap-1.1.6.tgz',
    )
    .thenCallback(() => {
      return {
        status: 200,
        rawBody: fs.readFileSync(SNAP_PATH),
        headers: {
          'Accept-Ranges': 'bytes',
          'Content-Length': '746597',
          'Content-Type': 'application/octet-stream',
          Etag: '"5e3236532d71422b12b808da978c2fbf"',
          Vary: 'Accept-Encoding',
        },
      };
    });
}

export async function mockWasmExampleSnap(mockServer: Mockttp) {
  const SNAP_PATH =
    'test/e2e/mock-response-data/snaps/wasm-example-snap-2.1.5.txt';
  return await mockServer
    .forGet(
      'https://registry.npmjs.org/@metamask/wasm-example-snap/-/wasm-example-snap-2.1.5.tgz',
    )
    .thenCallback(() => {
      return {
        status: 200,
        rawBody: fs.readFileSync(SNAP_PATH),
        headers: {
          'Accept-Ranges': 'bytes',
          'Content-Length': '13547',
          'Content-Type': 'application/octet-stream',
          Etag: '"d97d99aecc904046e68bd9bc1a73f1b0"',
          Vary: 'Accept-Encoding',
        },
      };
    });
}

export async function mockWebpackPluginExampleOldSnap(mockServer: Mockttp) {
  const SNAP_PATH =
    'test/e2e/mock-response-data/snaps/webpack-plugin-example-snap-2.0.0.txt';
  return await mockServer
    .forGet(
      'https://registry.npmjs.org/@metamask/webpack-plugin-example-snap/-/webpack-plugin-example-snap-2.0.0.tgz',
    )
    .thenCallback(() => {
      return {
        status: 200,
        rawBody: fs.readFileSync(SNAP_PATH),
        headers: {
          'Accept-Ranges': 'bytes',
          'Content-Length': '113150',
          'Content-Type': 'application/octet-stream',
          Etag: '"71894043451bb1d7cc3b2a241bee0b1a"',
          Vary: 'Accept-Encoding',
        },
      };
    });
}

export async function mockWebpackPluginExampleSnap(mockServer: Mockttp) {
  const SNAP_PATH =
    'test/e2e/mock-response-data/snaps/webpack-plugin-example-snap-2.1.3.txt';
  return await mockServer
    .forGet(
      'https://registry.npmjs.org/@metamask/webpack-plugin-example-snap/-/webpack-plugin-example-snap-2.1.3.tgz',
    )
    .thenCallback(() => {
      return {
        status: 200,
        rawBody: fs.readFileSync(SNAP_PATH),
        headers: {
          'Accept-Ranges': 'bytes',
          'Content-Length': '40753',
          'Content-Type': 'application/octet-stream',
          Etag: '"81ccca0d8e7c9ebd216820f080ff9dc4"',
          Vary: 'Accept-Encoding',
        },
      };
    });
}
