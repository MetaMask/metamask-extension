import fs from 'fs';
import { Mockttp } from 'mockttp';

export async function mockAccountAbstractionKeyringSnap(mockServer: Mockttp) {
  const SNAP_PATH =
    'test/e2e/mock-response-data/snaps/snap-binaries-and-headers/snap-account-abstraction-keyring-0.5.0.txt';
  const SNAP_HEADERS = fs.readFileSync(
    'test/e2e/mock-response-data/snaps/snap-binaries-and-headers/snap-account-abstraction-keyring-0.5.0-headers.json',
  );
  return await mockServer
    .forGet(
      'https://registry.npmjs.org/@metamask/snap-account-abstraction-keyring/-/snap-account-abstraction-keyring-0.5.0.tgz',
    )
    .thenCallback(() => {
      return {
        status: 200,
        rawBody: fs.readFileSync(SNAP_PATH),
        headers: JSON.parse(SNAP_HEADERS.toString()),
      };
    });
}

export async function mockBip32Snap(mockServer: Mockttp) {
  const SNAP_PATH =
    'test/e2e/mock-response-data/snaps/snap-binaries-and-headers/bip32-example-snap-2.3.0.txt';
  const SNAP_HEADERS = fs.readFileSync(
    'test/e2e/mock-response-data/snaps/snap-binaries-and-headers/bip32-example-snap-2.3.0-headers.json',
  );
  return await mockServer
    .forGet(
      'https://registry.npmjs.org/@metamask/bip32-example-snap/-/bip32-example-snap-2.3.0.tgz',
    )
    .thenCallback(() => {
      return {
        status: 200,
        rawBody: fs.readFileSync(SNAP_PATH),
        headers: JSON.parse(SNAP_HEADERS.toString()),
      };
    });
}

export async function mockBip44Snap(mockServer: Mockttp) {
  const SNAP_PATH =
    'test/e2e/mock-response-data/snaps/snap-binaries-and-headers/bip44-example-snap-2.2.0.txt';
  const SNAP_HEADERS = fs.readFileSync(
    'test/e2e/mock-response-data/snaps/snap-binaries-and-headers/bip44-example-snap-2.2.0-headers.json',
  );
  return await mockServer
    .forGet(
      'https://registry.npmjs.org/@metamask/bip44-example-snap/-/bip44-example-snap-2.2.0.tgz',
    )
    .thenCallback(() => {
      return {
        status: 200,
        rawBody: fs.readFileSync(SNAP_PATH),
        headers: JSON.parse(SNAP_HEADERS.toString()),
      };
    });
}

export async function mockClientStatusSnap(mockServer: Mockttp) {
  const SNAP_PATH =
    'test/e2e/mock-response-data/snaps/snap-binaries-and-headers/client-status-example-snap-1.0.3.txt';
  const SNAP_HEADERS = fs.readFileSync(
    'test/e2e/mock-response-data/snaps/snap-binaries-and-headers/client-status-example-snap-1.0.3-headers.json',
  );
  return await mockServer
    .forGet(
      'https://registry.npmjs.org/@metamask/client-status-example-snap/-/client-status-example-snap-1.0.3.tgz',
    )
    .thenCallback(() => {
      return {
        status: 200,
        rawBody: fs.readFileSync(SNAP_PATH),
        headers: JSON.parse(SNAP_HEADERS.toString()),
      };
    });
}

export async function mockCronjobSnap(mockServer: Mockttp) {
  const SNAP_PATH =
    'test/e2e/mock-response-data/snaps/snap-binaries-and-headers/cronjob-example-snap-3.0.0.txt';
  const SNAP_HEADERS = fs.readFileSync(
    'test/e2e/mock-response-data/snaps/snap-binaries-and-headers/cronjob-example-snap-3.0.0-headers.json',
  );
  return await mockServer
    .forGet(
      'https://registry.npmjs.org/@metamask/cronjob-example-snap/-/cronjob-example-snap-3.0.0.tgz',
    )
    .thenCallback(() => {
      return {
        status: 200,
        rawBody: fs.readFileSync(SNAP_PATH),
        headers: JSON.parse(SNAP_HEADERS.toString()),
      };
    });
}

export async function mockDialogSnap(mockServer: Mockttp) {
  const SNAP_PATH =
    'test/e2e/mock-response-data/snaps/snap-binaries-and-headers/dialog-example-snap-2.3.1.txt';
  const SNAP_HEADERS = fs.readFileSync(
    'test/e2e/mock-response-data/snaps/snap-binaries-and-headers/dialog-example-snap-2.3.1-headers.json',
  );
  return await mockServer
    .forGet(
      'https://registry.npmjs.org/@metamask/dialog-example-snap/-/dialog-example-snap-2.3.1.tgz',
    )
    .thenCallback(() => {
      return {
        status: 200,
        rawBody: fs.readFileSync(SNAP_PATH),
        headers: JSON.parse(SNAP_HEADERS.toString()),
      };
    });
}

export async function mockErrorSnap(mockServer: Mockttp) {
  const SNAP_PATH =
    'test/e2e/mock-response-data/snaps/snap-binaries-and-headers/error-example-snap-2.1.3.txt';
  const SNAP_HEADERS = fs.readFileSync(
    'test/e2e/mock-response-data/snaps/snap-binaries-and-headers/error-example-snap-2.1.3-headers.json',
  );
  return await mockServer
    .forGet(
      'https://registry.npmjs.org/@metamask/error-example-snap/-/error-example-snap-2.1.3.tgz',
    )
    .thenCallback(() => {
      return {
        status: 200,
        rawBody: fs.readFileSync(SNAP_PATH),
        headers: JSON.parse(SNAP_HEADERS.toString()),
      };
    });
}

export async function mockEthereumProviderSnap(mockServer: Mockttp) {
  const SNAP_PATH =
    'test/e2e/mock-response-data/snaps/snap-binaries-and-headers/ethereum-provider-example-snap-2.2.1.txt';
  const SNAP_HEADERS = fs.readFileSync(
    'test/e2e/mock-response-data/snaps/snap-binaries-and-headers/ethereum-provider-example-snap-2.2.1-headers.json',
  );
  return await mockServer
    .forGet(
      'https://registry.npmjs.org/@metamask/ethereum-provider-example-snap/-/ethereum-provider-example-snap-2.2.1.tgz',
    )
    .thenCallback(() => {
      return {
        status: 200,
        rawBody: fs.readFileSync(SNAP_PATH),
        headers: JSON.parse(SNAP_HEADERS.toString()),
      };
    });
}

export async function mockGetEntropySnap(mockServer: Mockttp) {
  const SNAP_PATH =
    'test/e2e/mock-response-data/snaps/snap-binaries-and-headers/get-entropy-example-snap-2.2.0.txt';
  const SNAP_HEADERS = fs.readFileSync(
    'test/e2e/mock-response-data/snaps/snap-binaries-and-headers/get-entropy-example-snap-2.2.0-headers.json',
  );
  return await mockServer
    .forGet(
      'https://registry.npmjs.org/@metamask/get-entropy-example-snap/-/get-entropy-example-snap-2.2.0.tgz',
    )
    .thenCallback(() => {
      return {
        status: 200,
        rawBody: fs.readFileSync(SNAP_PATH),
        headers: JSON.parse(SNAP_HEADERS.toString()),
      };
    });
}

export async function mockGetFileSnap(mockServer: Mockttp) {
  const SNAP_PATH =
    'test/e2e/mock-response-data/snaps/snap-binaries-and-headers/get-file-example-snap-1.1.3.txt';
  const SNAP_HEADERS = fs.readFileSync(
    'test/e2e/mock-response-data/snaps/snap-binaries-and-headers/get-file-example-snap-1.1.3-headers.json',
  );
  return await mockServer
    .forGet(
      'https://registry.npmjs.org/@metamask/get-file-example-snap/-/get-file-example-snap-1.1.3.tgz',
    )
    .thenCallback(() => {
      return {
        status: 200,
        rawBody: fs.readFileSync(SNAP_PATH),
        headers: JSON.parse(SNAP_HEADERS.toString()),
      };
    });
}

export async function mockHomePageSnap(mockServer: Mockttp) {
  const SNAP_PATH =
    'test/e2e/mock-response-data/snaps/snap-binaries-and-headers/home-page-example-snap-1.1.3.txt';
  const SNAP_HEADERS = fs.readFileSync(
    'test/e2e/mock-response-data/snaps/snap-binaries-and-headers/home-page-example-snap-1.1.3-headers.json',
  );
  return await mockServer
    .forGet(
      'https://registry.npmjs.org/@metamask/home-page-example-snap/-/home-page-example-snap-1.1.3.tgz',
    )
    .thenCallback(() => {
      return {
        status: 200,
        rawBody: fs.readFileSync(SNAP_PATH),
        headers: JSON.parse(SNAP_HEADERS.toString()),
      };
    });
}

export async function mockImagesSnap(mockServer: Mockttp) {
  const SNAP_PATH =
    'test/e2e/mock-response-data/snaps/snap-binaries-and-headers/images-example-snap-1.1.1.txt';
  const SNAP_HEADERS = fs.readFileSync(
    'test/e2e/mock-response-data/snaps/snap-binaries-and-headers/images-example-snap-1.1.1-headers.json',
  );
  return await mockServer
    .forGet(
      'https://registry.npmjs.org/@metamask/images-example-snap/-/images-example-snap-1.1.1.tgz',
    )
    .thenCallback(() => {
      return {
        status: 200,
        rawBody: fs.readFileSync(SNAP_PATH),
        headers: JSON.parse(SNAP_HEADERS.toString()),
      };
    });
}

export async function mockInsightsSnap(mockServer: Mockttp) {
  const SNAP_PATH =
    'test/e2e/mock-response-data/snaps/snap-binaries-and-headers/insights-example-snap-2.2.3.txt';
  const SNAP_HEADERS = fs.readFileSync(
    'test/e2e/mock-response-data/snaps/snap-binaries-and-headers/insights-example-snap-2.2.3-headers.json',
  );
  return await mockServer
    .forGet(
      'https://registry.npmjs.org/@metamask/insights-example-snap/-/insights-example-snap-2.2.3.tgz',
    )
    .thenCallback(() => {
      return {
        status: 200,
        rawBody: fs.readFileSync(SNAP_PATH),
        headers: JSON.parse(SNAP_HEADERS.toString()),
      };
    });
}

export async function mockInteractiveUiSnap(mockServer: Mockttp) {
  const SNAP_PATH =
    'test/e2e/mock-response-data/snaps/snap-binaries-and-headers/interactive-ui-example-snap-2.4.0.txt';
  const SNAP_HEADERS = fs.readFileSync(
    'test/e2e/mock-response-data/snaps/snap-binaries-and-headers/interactive-ui-example-snap-2.4.0-headers.json',
  );
  return await mockServer
    .forGet(
      'https://registry.npmjs.org/@metamask/interactive-ui-example-snap/-/interactive-ui-example-snap-2.4.0.tgz',
    )
    .thenCallback(() => {
      return {
        status: 200,
        rawBody: fs.readFileSync(SNAP_PATH),
        headers: JSON.parse(SNAP_HEADERS.toString()),
      };
    });
}

export async function mockJsonRpcSnap(mockServer: Mockttp) {
  const SNAP_PATH =
    'test/e2e/mock-response-data/snaps/snap-binaries-and-headers/json-rpc-example-snap-2.1.3.txt';
  const SNAP_HEADERS = fs.readFileSync(
    'test/e2e/mock-response-data/snaps/snap-binaries-and-headers/json-rpc-example-snap-2.1.3-headers.json',
  );
  return await mockServer
    .forGet(
      'https://registry.npmjs.org/@metamask/json-rpc-example-snap/-/json-rpc-example-snap-2.1.3.tgz',
    )
    .thenCallback(() => {
      return {
        status: 200,
        rawBody: fs.readFileSync(SNAP_PATH),
        headers: JSON.parse(SNAP_HEADERS.toString()),
      };
    });
}

export async function mockJsxSnap(mockServer: Mockttp) {
  const SNAP_PATH =
    'test/e2e/mock-response-data/snaps/snap-binaries-and-headers/jsx-example-snap-1.2.1.txt';
  const SNAP_HEADERS = fs.readFileSync(
    'test/e2e/mock-response-data/snaps/snap-binaries-and-headers/jsx-example-snap-1.2.1-headers.json',
  );
  return await mockServer
    .forGet(
      'https://registry.npmjs.org/@metamask/jsx-example-snap/-/jsx-example-snap-1.2.1.tgz',
    )
    .thenCallback(() => {
      return {
        status: 200,
        rawBody: fs.readFileSync(SNAP_PATH),
        headers: JSON.parse(SNAP_HEADERS.toString()),
      };
    });
}

export async function mockLifecycleHooksSnap(mockServer: Mockttp) {
  const SNAP_PATH =
    'test/e2e/mock-response-data/snaps/snap-binaries-and-headers/lifecycle-hooks-example-snap-2.1.3.txt';
  const SNAP_HEADERS = fs.readFileSync(
    'test/e2e/mock-response-data/snaps/snap-binaries-and-headers/lifecycle-hooks-example-snap-2.1.3-headers.json',
  );
  return await mockServer
    .forGet(
      'https://registry.npmjs.org/@metamask/lifecycle-hooks-example-snap/-/lifecycle-hooks-example-snap-2.1.3.tgz',
    )
    .thenCallback(() => {
      return {
        status: 200,
        rawBody: fs.readFileSync(SNAP_PATH),
        headers: JSON.parse(SNAP_HEADERS.toString()),
      };
    });
}

export async function mockLocalizationSnap(mockServer: Mockttp) {
  const SNAP_PATH =
    'test/e2e/mock-response-data/snaps/snap-binaries-and-headers/localization-example-snap-1.1.4.txt';
  const SNAP_HEADERS = fs.readFileSync(
    'test/e2e/mock-response-data/snaps/snap-binaries-and-headers/localization-example-snap-1.1.4-headers.json',
  );
  return await mockServer
    .forGet(
      'https://registry.npmjs.org/@metamask/localization-example-snap/-/localization-example-snap-1.1.4.tgz',
    )
    .thenCallback(() => {
      return {
        status: 200,
        rawBody: fs.readFileSync(SNAP_PATH),
        headers: JSON.parse(SNAP_HEADERS.toString()),
      };
    });
}

export async function mockLookupSnap(mockServer: Mockttp) {
  const SNAP_PATH =
    'test/e2e/mock-response-data/snaps/snap-binaries-and-headers/name-lookup-example-snap-3.1.1.txt';
  const SNAP_HEADERS = fs.readFileSync(
    'test/e2e/mock-response-data/snaps/snap-binaries-and-headers/name-lookup-example-snap-3.1.1-headers.json',
  );
  return await mockServer
    .forGet(
      'https://registry.npmjs.org/@metamask/name-lookup-example-snap/-/name-lookup-example-snap-3.1.1.tgz',
    )
    .thenCallback(() => {
      return {
        status: 200,
        rawBody: fs.readFileSync(SNAP_PATH),
        headers: JSON.parse(SNAP_HEADERS.toString()),
      };
    });
}

export async function mockManageStateSnap(mockServer: Mockttp) {
  const SNAP_PATH =
    'test/e2e/mock-response-data/snaps/snap-binaries-and-headers/manage-state-example-snap-3.0.0.txt';
  const SNAP_HEADERS = fs.readFileSync(
    'test/e2e/mock-response-data/snaps/snap-binaries-and-headers/manage-state-example-snap-3.0.0-headers.json',
  );
  return await mockServer
    .forGet(
      'https://registry.npmjs.org/@metamask/manage-state-example-snap/-/manage-state-example-snap-3.0.0.tgz',
    )
    .thenCallback(() => {
      return {
        status: 200,
        rawBody: fs.readFileSync(SNAP_PATH),
        headers: JSON.parse(SNAP_HEADERS.toString()),
      };
    });
}

export async function mockNetworkSnap(mockServer: Mockttp) {
  const SNAP_PATH =
    'test/e2e/mock-response-data/snaps/snap-binaries-and-headers/network-example-snap-2.1.3.txt';
  const SNAP_HEADERS = fs.readFileSync(
    'test/e2e/mock-response-data/snaps/snap-binaries-and-headers/network-example-snap-2.1.3-headers.json',
  );
  return await mockServer
    .forGet(
      'https://registry.npmjs.org/@metamask/network-example-snap/-/network-example-snap-2.1.3.tgz',
    )
    .thenCallback(() => {
      return {
        status: 200,
        rawBody: fs.readFileSync(SNAP_PATH),
        headers: JSON.parse(SNAP_HEADERS.toString()),
      };
    });
}

export async function mockNotificationSnap(mockServer: Mockttp) {
  const SNAP_PATH =
    'test/e2e/mock-response-data/snaps/snap-binaries-and-headers/notification-example-snap-2.3.0.txt';
  const SNAP_HEADERS = fs.readFileSync(
    'test/e2e/mock-response-data/snaps/snap-binaries-and-headers/notification-example-snap-2.3.0-headers.json',
  );
  return await mockServer
    .forGet(
      'https://registry.npmjs.org/@metamask/notification-example-snap/-/notification-example-snap-2.3.0.tgz',
    )
    .thenCallback(() => {
      return {
        status: 200,
        rawBody: fs.readFileSync(SNAP_PATH),
        headers: JSON.parse(SNAP_HEADERS.toString()),
      };
    });
}

export async function mockPreferencesSnap(mockServer: Mockttp) {
  const SNAP_PATH =
    'test/e2e/mock-response-data/snaps/snap-binaries-and-headers/preferences-example-snap-1.0.0.txt';
  const SNAP_HEADERS = fs.readFileSync(
    'test/e2e/mock-response-data/snaps/snap-binaries-and-headers/preferences-example-snap-1.0.0-headers.json',
  );
  return await mockServer
    .forGet(
      'https://registry.npmjs.org/@metamask/preferences-example-snap/-/preferences-example-snap-1.0.0.tgz',
    )
    .thenCallback(() => {
      return {
        status: 200,
        rawBody: fs.readFileSync(SNAP_PATH),
        headers: JSON.parse(SNAP_HEADERS.toString()),
      };
    });
}

export async function mockSignatureInsightsSnap(mockServer: Mockttp) {
  const SNAP_PATH =
    'test/e2e/mock-response-data/snaps/snap-binaries-and-headers/signature-insights-example-snap-1.0.3.txt';
  const SNAP_HEADERS = fs.readFileSync(
    'test/e2e/mock-response-data/snaps/snap-binaries-and-headers/signature-insights-example-snap-1.0.3-headers.json',
  );
  return await mockServer
    .forGet(
      'https://registry.npmjs.org/@metamask/signature-insights-example-snap/-/signature-insights-example-snap-1.0.3.tgz',
    )
    .thenCallback(() => {
      return {
        status: 200,
        rawBody: fs.readFileSync(SNAP_PATH),
        headers: JSON.parse(SNAP_HEADERS.toString()),
      };
    });
}

export async function mockSimpleKeyringSnap(mockServer: Mockttp) {
  const SNAP_PATH =
    'test/e2e/mock-response-data/snaps/snap-binaries-and-headers/snap-simple-keyring-snap-1.1.6.txt';
  const SNAP_HEADERS = fs.readFileSync(
    'test/e2e/mock-response-data/snaps/snap-binaries-and-headers/snap-simple-keyring-snap-1.1.6-headers.json',
  );
  return await mockServer
    .forGet(
      'https://registry.npmjs.org/@metamask/snap-simple-keyring-snap/-/snap-simple-keyring-snap-1.1.6.tgz',
    )
    .thenCallback(() => {
      return {
        status: 200,
        rawBody: fs.readFileSync(SNAP_PATH),
        headers: JSON.parse(SNAP_HEADERS.toString()),
      };
    });
}

export async function mockWasmSnap(mockServer: Mockttp) {
  const SNAP_PATH =
    'test/e2e/mock-response-data/snaps/snap-binaries-and-headers/wasm-example-snap-2.1.5.txt';
  const SNAP_HEADERS = fs.readFileSync(
    'test/e2e/mock-response-data/snaps/snap-binaries-and-headers/wasm-example-snap-2.1.5-headers.json',
  );
  return await mockServer
    .forGet(
      'https://registry.npmjs.org/@metamask/wasm-example-snap/-/wasm-example-snap-2.1.5.tgz',
    )
    .thenCallback(() => {
      return {
        status: 200,
        rawBody: fs.readFileSync(SNAP_PATH),
        headers: JSON.parse(SNAP_HEADERS.toString()),
      };
    });
}

export async function mockWebpackPluginOldSnap(mockServer: Mockttp) {
  const SNAP_PATH =
    'test/e2e/mock-response-data/snaps/snap-binaries-and-headers/webpack-plugin-example-snap-2.0.0.txt';
  const SNAP_HEADERS = fs.readFileSync(
    'test/e2e/mock-response-data/snaps/snap-binaries-and-headers/webpack-plugin-example-snap-2.0.0-headers.json',
  );
  return await mockServer
    .forGet(
      'https://registry.npmjs.org/@metamask/webpack-plugin-example-snap/-/webpack-plugin-example-snap-2.0.0.tgz',
    )
    .thenCallback(() => {
      return {
        status: 200,
        rawBody: fs.readFileSync(SNAP_PATH),
        headers: JSON.parse(SNAP_HEADERS.toString()),
      };
    });
}

export async function mockWebpackPluginSnap(mockServer: Mockttp) {
  const SNAP_PATH =
    'test/e2e/mock-response-data/snaps/snap-binaries-and-headers/webpack-plugin-example-snap-2.1.3.txt';
  const SNAP_HEADERS = fs.readFileSync(
    'test/e2e/mock-response-data/snaps/snap-binaries-and-headers/webpack-plugin-example-snap-2.1.3-headers.json',
  );
  return await mockServer
    .forGet(
      'https://registry.npmjs.org/@metamask/webpack-plugin-example-snap/-/webpack-plugin-example-snap-2.1.3.tgz',
    )
    .thenCallback(() => {
      return {
        status: 200,
        rawBody: fs.readFileSync(SNAP_PATH),
        headers: JSON.parse(SNAP_HEADERS.toString()),
      };
    });
}
