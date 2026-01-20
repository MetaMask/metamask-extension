import fs from 'fs';
import { escapeRegExp } from 'lodash';
import { Mockttp } from 'mockttp';
import { sort as semverSort } from 'semver';

const SNAP_ASSETS_RELATIVE_PATH =
  'test/e2e/mock-response-data/snaps/snap-binaries-and-headers';
const NPM_REGISTRY_METAMASK_BASE_URL = 'https://registry.npmjs.org/@metamask';

/**
 * Retrieves the latest version of a snap from the local file system based on its name prefix.
 * It looks for files named `<snapNamePrefix>@<version>.txt`, collects all versions,
 * sorts them semantically, and returns the latest one.
 *
 * @param snapNamePrefix - The prefix of the snap name (e.g., 'bip32-example-snap').
 * @returns The latest version string found for the snap.
 * @throws If no version file is found for the given snap prefix in the directory.
 */
export function getLocalSnapLatestVersion(snapNamePrefix: string): string {
  const files = fs.readdirSync(SNAP_ASSETS_RELATIVE_PATH);
  const sanitizedSnapNamePrefix = escapeRegExp(snapNamePrefix);
  const versionRegex = new RegExp(
    `${sanitizedSnapNamePrefix}@(\\d+\\.\\d+\\.\\d+)\\.txt`,
    'u',
  );
  const foundVersions: string[] = [];
  for (const file of files) {
    const match = file.match(versionRegex);
    if (match?.[1]) {
      foundVersions.push(match[1]);
    }
  }

  if (foundVersions.length === 0) {
    throw new Error(
      `No version found for snap "${snapNamePrefix}" (using @version format) in directory "${SNAP_ASSETS_RELATIVE_PATH}".`,
    );
  }

  const sortedVersions = semverSort(foundVersions);

  // The last element after sorting will be the latest version
  return sortedVersions[sortedVersions.length - 1];
}

/**
 * Creates a mock endpoint for a snap hosted on the npm registry.
 * It reads the snap binary and headers from local files based on the snap name prefix and version.
 * The version can be explicitly provided or determined by scanning local files.
 *
 * @param options - The options for creating the snap mock.
 * @param options.mockServer - The mockttp server instance.
 * @param options.snapNamePrefix - The prefix of the snap name (e.g., 'bip32-example-snap').
 * @param [options.specificVersion] - An optional specific version string for the snap. If not provided, `getLocalSnapLatestVersion` will be used to determine the version.
 * @returns A promise that resolves to the mocked endpoint.
 */
async function createSnapMock(options: {
  mockServer: Mockttp;
  snapNamePrefix: string;
  specificVersion?: string;
}) {
  const { mockServer, snapNamePrefix, specificVersion } = options;
  const VERSION = specificVersion ?? getLocalSnapLatestVersion(snapNamePrefix);
  const SNAP_PATH = `${SNAP_ASSETS_RELATIVE_PATH}/${snapNamePrefix}@${VERSION}.txt`;
  const SNAP_HEADERS_PATH = `${SNAP_ASSETS_RELATIVE_PATH}/${snapNamePrefix}@${VERSION}-headers.json`;

  return mockServer
    .forGet(
      `${NPM_REGISTRY_METAMASK_BASE_URL}/${snapNamePrefix}/-/${snapNamePrefix}-${VERSION}.tgz`,
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
  mockCronjobDurationSnap: 'cronjob-duration-example-snap',
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
  mockProtocolSnap: 'protocol-example-snap',
  mockSignatureInsightsSnap: 'signature-insights-example-snap',
  mockSimpleKeyringSnap: 'snap-simple-keyring-snap',
  mockWasmSnap: 'wasm-example-snap',
  mockWebpackPluginSnap: 'webpack-plugin-example-snap',
  mockBackgroundEventsSnap: 'background-events-example-snap',
};

export async function mockAccountAbstractionKeyringSnap(mockServer: Mockttp) {
  return createSnapMock({
    mockServer,
    snapNamePrefix: snapConfigurations.mockAccountAbstractionKeyringSnap,
  });
}

export async function mockBip32Snap(mockServer: Mockttp) {
  return createSnapMock({
    mockServer,
    snapNamePrefix: snapConfigurations.mockBip32Snap,
  });
}

export async function mockBip44Snap(mockServer: Mockttp) {
  return createSnapMock({
    mockServer,
    snapNamePrefix: snapConfigurations.mockBip44Snap,
  });
}

export async function mockClientStatusSnap(mockServer: Mockttp) {
  return createSnapMock({
    mockServer,
    snapNamePrefix: snapConfigurations.mockClientStatusSnap,
  });
}

export async function mockCronjobSnap(mockServer: Mockttp) {
  return createSnapMock({
    mockServer,
    snapNamePrefix: snapConfigurations.mockCronjobSnap,
  });
}

export async function mockCronjobDurationSnap(mockServer: Mockttp) {
  return createSnapMock({
    mockServer,
    snapNamePrefix: snapConfigurations.mockCronjobDurationSnap,
  });
}

export async function mockDialogSnap(mockServer: Mockttp) {
  return createSnapMock({
    mockServer,
    snapNamePrefix: snapConfigurations.mockDialogSnap,
  });
}

export async function mockErrorSnap(mockServer: Mockttp) {
  return createSnapMock({
    mockServer,
    snapNamePrefix: snapConfigurations.mockErrorSnap,
  });
}

export async function mockEthereumProviderSnap(mockServer: Mockttp) {
  return createSnapMock({
    mockServer,
    snapNamePrefix: snapConfigurations.mockEthereumProviderSnap,
  });
}

export async function mockGetEntropySnap(mockServer: Mockttp) {
  return createSnapMock({
    mockServer,
    snapNamePrefix: snapConfigurations.mockGetEntropySnap,
  });
}

export async function mockGetFileSnap(mockServer: Mockttp) {
  return createSnapMock({
    mockServer,
    snapNamePrefix: snapConfigurations.mockGetFileSnap,
  });
}

export async function mockHomePageSnap(mockServer: Mockttp) {
  return createSnapMock({
    mockServer,
    snapNamePrefix: snapConfigurations.mockHomePageSnap,
  });
}

export async function mockImagesSnap(mockServer: Mockttp) {
  return createSnapMock({
    mockServer,
    snapNamePrefix: snapConfigurations.mockImagesSnap,
  });
}

export async function mockInsightsSnap(mockServer: Mockttp) {
  return createSnapMock({
    mockServer,
    snapNamePrefix: snapConfigurations.mockInsightsSnap,
  });
}

export async function mockInteractiveUiSnap(mockServer: Mockttp) {
  return createSnapMock({
    mockServer,
    snapNamePrefix: snapConfigurations.mockInteractiveUiSnap,
  });
}

export async function mockJsonRpcSnap(mockServer: Mockttp) {
  return createSnapMock({
    mockServer,
    snapNamePrefix: snapConfigurations.mockJsonRpcSnap,
  });
}

export async function mockJsxSnap(mockServer: Mockttp) {
  return createSnapMock({
    mockServer,
    snapNamePrefix: snapConfigurations.mockJsxSnap,
  });
}

export async function mockLifecycleHooksSnap(mockServer: Mockttp) {
  return createSnapMock({
    mockServer,
    snapNamePrefix: snapConfigurations.mockLifecycleHooksSnap,
  });
}

export async function mockLocalizationSnap(mockServer: Mockttp) {
  return createSnapMock({
    mockServer,
    snapNamePrefix: snapConfigurations.mockLocalizationSnap,
  });
}

export async function mockLookupSnap(mockServer: Mockttp) {
  return createSnapMock({
    mockServer,
    snapNamePrefix: snapConfigurations.mockLookupSnap,
  });
}

export async function mockManageStateSnap(mockServer: Mockttp) {
  return createSnapMock({
    mockServer,
    snapNamePrefix: snapConfigurations.mockManageStateSnap,
  });
}

export async function mockNetworkSnap(mockServer: Mockttp) {
  return createSnapMock({
    mockServer,
    snapNamePrefix: snapConfigurations.mockNetworkSnap,
  });
}

export async function mockNotificationSnap(mockServer: Mockttp) {
  return createSnapMock({
    mockServer,
    snapNamePrefix: snapConfigurations.mockNotificationSnap,
  });
}

export async function mockProtocolSnap(mockServer: Mockttp) {
  return createSnapMock({
    mockServer,
    snapNamePrefix: snapConfigurations.mockProtocolSnap,
  });
}

export async function mockPreferencesSnap(mockServer: Mockttp) {
  return createSnapMock({
    mockServer,
    snapNamePrefix: snapConfigurations.mockPreferencesSnap,
  });
}

export async function mockSignatureInsightsSnap(mockServer: Mockttp) {
  return createSnapMock({
    mockServer,
    snapNamePrefix: snapConfigurations.mockSignatureInsightsSnap,
  });
}

export async function mockSimpleKeyringSnap(mockServer: Mockttp) {
  return createSnapMock({
    mockServer,
    snapNamePrefix: snapConfigurations.mockSimpleKeyringSnap,
  });
}

export async function mockWasmSnap(mockServer: Mockttp) {
  return createSnapMock({
    mockServer,
    snapNamePrefix: snapConfigurations.mockWasmSnap,
  });
}

export async function mockWebpackPluginOldSnap(mockServer: Mockttp) {
  return createSnapMock({
    mockServer,
    snapNamePrefix: snapConfigurations.mockWebpackPluginSnap,
    specificVersion: '2.0.0',
  });
}

export async function mockWebpackPluginSnap(mockServer: Mockttp) {
  return createSnapMock({
    mockServer,
    snapNamePrefix: snapConfigurations.mockWebpackPluginSnap,
  });
}

export async function mockBackgroundEventsSnap(mockServer: Mockttp) {
  return createSnapMock({
    mockServer,
    snapNamePrefix: snapConfigurations.mockBackgroundEventsSnap,
  });
}
