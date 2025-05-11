import fs from 'fs';
import { Mockttp } from 'mockttp';

const SNAP_ASSETS_RELATIVE_PATH =
  'test/e2e/mock-response-data/snaps/snap-binaries-and-headers';
const NPM_REGISTRY_METAMASK_BASE_URL = 'https://registry.npmjs.org/@metamask';

function getLocalSnapVersion(snapNamePrefix: string): string {
  const files = fs.readdirSync(SNAP_ASSETS_RELATIVE_PATH);
  const versionRegex = new RegExp(
    `${snapNamePrefix}-(\\d+\\.\\d+\\.\\d+)\\.txt`,
    'u',
  );
  let foundVersion: string | null = null;
  for (const file of files) {
    const match = file.match(versionRegex);
    if (match?.[1]) {
      foundVersion = match[1];
      break;
    }
  }
  if (!foundVersion) {
    throw new Error(
      `No version found for snap "${snapNamePrefix}" in directory "${SNAP_ASSETS_RELATIVE_PATH}".`,
    );
  }
  return foundVersion;
}

async function createSnapMock(mockServer: Mockttp, snapNamePrefix: string) {
  const VERSION = getLocalSnapVersion(snapNamePrefix);
  const SNAP_PATH = `${SNAP_ASSETS_RELATIVE_PATH}/${snapNamePrefix}-${VERSION}.txt`;
  const SNAP_HEADERS_PATH = `${SNAP_ASSETS_RELATIVE_PATH}/${snapNamePrefix}-${VERSION}-headers.json`;

  return mockServer
    .forGet(
      new RegExp(`${NPM_REGISTRY_METAMASK_BASE_URL}/${snapNamePrefix}/.*`, 'u'),
    )
    .thenCallback(() => {
      return {
        status: 200,
        rawBody: fs.readFileSync(SNAP_PATH),
        headers: JSON.parse(fs.readFileSync(SNAP_HEADERS_PATH).toString()),
      };
    });
}

const snapConfigurations: Record<string, string> = {
  mockAccountAbstractionKeyringSnap: 'snap-account-abstraction-keyring',
  mockBip32Snap: 'bip32-example-snap',
  mockBip44Snap: 'bip44-example-snap',
  mockClientStatusSnap: 'client-status-example-snap',
  mockCronjobSnap: 'cronjob-example-snap',
  mockDialogSnap: 'dialog-example-snap',
  mockErrorSnap: 'error-example-snap',
  mockEthereumProviderSnap: 'ethereum-provider-example-snap',
  mockGetEntropySnap: 'get-entropy-example-snap',
  mockGetFileSnap: 'get-file-example-snap',
  mockHomePageSnap: 'home-page-example-snap',
  mockImagesSnap: 'images-example-snap',
  mockInsightsSnap: 'insights-example-snap',
  mockInteractiveUiSnap: 'interactive-ui-example-snap',
  mockJsonRpcSnap: 'json-rpc-example-snap',
  mockJsxSnap: 'jsx-example-snap',
  mockLifecycleHooksSnap: 'lifecycle-hooks-example-snap',
  mockLocalizationSnap: 'localization-example-snap',
  mockLookupSnap: 'name-lookup-example-snap',
  mockManageStateSnap: 'manage-state-example-snap',
  mockNetworkSnap: 'network-example-snap',
  mockNotificationSnap: 'notification-example-snap',
  mockPreferencesSnap: 'preferences-example-snap',
  mockSignatureInsightsSnap: 'signature-insights-example-snap',
  mockSimpleKeyringSnap: 'snap-simple-keyring-snap',
  mockWasmSnap: 'wasm-example-snap',
  mockWebpackPluginOldSnap: 'webpack-plugin-example-snap',
  mockWebpackPluginSnap: 'webpack-plugin-example-snap',
};

export async function mockAccountAbstractionKeyringSnap(mockServer: Mockttp) {
  return createSnapMock(
    mockServer,
    snapConfigurations.mockAccountAbstractionKeyringSnap,
  );
}

export async function mockBip32Snap(mockServer: Mockttp) {
  return createSnapMock(mockServer, snapConfigurations.mockBip32Snap);
}

export async function mockBip44Snap(mockServer: Mockttp) {
  return createSnapMock(mockServer, snapConfigurations.mockBip44Snap);
}

export async function mockClientStatusSnap(mockServer: Mockttp) {
  return createSnapMock(mockServer, snapConfigurations.mockClientStatusSnap);
}

export async function mockCronjobSnap(mockServer: Mockttp) {
  return createSnapMock(mockServer, snapConfigurations.mockCronjobSnap);
}

export async function mockDialogSnap(mockServer: Mockttp) {
  return createSnapMock(mockServer, snapConfigurations.mockDialogSnap);
}

export async function mockErrorSnap(mockServer: Mockttp) {
  return createSnapMock(mockServer, snapConfigurations.mockErrorSnap);
}

export async function mockEthereumProviderSnap(mockServer: Mockttp) {
  return createSnapMock(
    mockServer,
    snapConfigurations.mockEthereumProviderSnap,
  );
}

export async function mockGetEntropySnap(mockServer: Mockttp) {
  return createSnapMock(mockServer, snapConfigurations.mockGetEntropySnap);
}

export async function mockGetFileSnap(mockServer: Mockttp) {
  return createSnapMock(mockServer, snapConfigurations.mockGetFileSnap);
}

export async function mockHomePageSnap(mockServer: Mockttp) {
  return createSnapMock(mockServer, snapConfigurations.mockHomePageSnap);
}

export async function mockImagesSnap(mockServer: Mockttp) {
  return createSnapMock(mockServer, snapConfigurations.mockImagesSnap);
}

export async function mockInsightsSnap(mockServer: Mockttp) {
  return createSnapMock(mockServer, snapConfigurations.mockInsightsSnap);
}

export async function mockInteractiveUiSnap(mockServer: Mockttp) {
  return createSnapMock(mockServer, snapConfigurations.mockInteractiveUiSnap);
}

export async function mockJsonRpcSnap(mockServer: Mockttp) {
  return createSnapMock(mockServer, snapConfigurations.mockJsonRpcSnap);
}

export async function mockJsxSnap(mockServer: Mockttp) {
  return createSnapMock(mockServer, snapConfigurations.mockJsxSnap);
}

export async function mockLifecycleHooksSnap(mockServer: Mockttp) {
  return createSnapMock(mockServer, snapConfigurations.mockLifecycleHooksSnap);
}

export async function mockLocalizationSnap(mockServer: Mockttp) {
  return createSnapMock(mockServer, snapConfigurations.mockLocalizationSnap);
}

export async function mockLookupSnap(mockServer: Mockttp) {
  return createSnapMock(mockServer, snapConfigurations.mockLookupSnap);
}

export async function mockManageStateSnap(mockServer: Mockttp) {
  return createSnapMock(mockServer, snapConfigurations.mockManageStateSnap);
}

export async function mockNetworkSnap(mockServer: Mockttp) {
  return createSnapMock(mockServer, snapConfigurations.mockNetworkSnap);
}

export async function mockNotificationSnap(mockServer: Mockttp) {
  return createSnapMock(mockServer, snapConfigurations.mockNotificationSnap);
}

export async function mockPreferencesSnap(mockServer: Mockttp) {
  return createSnapMock(mockServer, snapConfigurations.mockPreferencesSnap);
}

export async function mockSignatureInsightsSnap(mockServer: Mockttp) {
  return createSnapMock(
    mockServer,
    snapConfigurations.mockSignatureInsightsSnap,
  );
}

export async function mockSimpleKeyringSnap(mockServer: Mockttp) {
  return createSnapMock(mockServer, snapConfigurations.mockSimpleKeyringSnap);
}

export async function mockWasmSnap(mockServer: Mockttp) {
  return createSnapMock(mockServer, snapConfigurations.mockWasmSnap);
}

export async function mockWebpackPluginOldSnap(mockServer: Mockttp) {
  return createSnapMock(
    mockServer,
    snapConfigurations.mockWebpackPluginOldSnap,
  );
}

export async function mockWebpackPluginSnap(mockServer: Mockttp) {
  return createSnapMock(mockServer, snapConfigurations.mockWebpackPluginSnap);
}
