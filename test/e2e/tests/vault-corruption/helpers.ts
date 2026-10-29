import { Mockttp } from 'mockttp';
import { type ManifestFlags } from '../../../../shared/lib/manifestFlags';
import { getProductionRemoteFlagApiResponse } from '../../feature-flags';

const FEATURE_FLAGS_URL = 'https://client-config.api.cx.metamask.io/v1/flags';

const NON_EVM_ACCOUNT_FLAG_OVERRIDES = [
  { bitcoinAccounts: { enabled: false, minimumVersion: '0.0.0' } },
  { solanaAccounts: { enabled: false, minimumVersion: '0.0.0' } },
  { tronAccounts: { enabled: false, minimumVersion: '0.0.0' } },
  {
    enableMultichainAccounts: {
      enabled: false,
      featureVersion: null,
      minimumVersion: null,
    },
  },
  {
    enableMultichainAccountsState2: {
      enabled: false,
      featureVersion: null,
      minimumVersion: null,
    },
  },
];

// Remove when the bug is fixed: https://github.com/MetaMask/metamask-extension/issues/39068
export async function mockFeatureFlagsWithoutNonEvmAccounts(
  mockServer: Mockttp,
) {
  const prodFlags = getProductionRemoteFlagApiResponse();
  return [
    await mockServer
      .forGet(FEATURE_FLAGS_URL)
      .withQuery({
        client: 'extension',
        distribution: 'main',
        environment: 'dev',
      })
      .always()
      .thenCallback(() => ({
        statusCode: 200,
        json: [...prodFlags, ...NON_EVM_ACCOUNT_FLAG_OVERRIDES],
      })),
  ];
}

/**
 * Returns the config for database/vault corruption tests.
 *
 * @param title - The title of the test.
 * @param options - Additional options.
 * @param options.additionalIgnoredErrors - Additional console errors to ignore.
 * @param options.additionalManifestFlags - Additional manifest flags.
 * @returns The test configuration object.
 */
export function getConfig(
  title?: string,
  options: {
    additionalIgnoredErrors?: string[];
    additionalManifestFlags?: ManifestFlags;
  } = {},
): {
  title?: string;
  ignoredConsoleErrors: string[];
  manifestFlags: ManifestFlags;
} {
  const { additionalIgnoredErrors = [], additionalManifestFlags = {} } =
    options;

  const manifestFlags: ManifestFlags = {
    ...additionalManifestFlags,
    testing: {
      forceExtensionStore: true,
      ...(additionalManifestFlags.testing ?? {}),
    },
  };

  return {
    title,
    ignoredConsoleErrors: [
      // Expected error caused by breaking the database:
      'PersistenceError: Data error: storage.local does not contain vault data',
      ...additionalIgnoredErrors,
    ],
    // This flag ultimately requires that we onboard manually, as we can't use
    // `fixtures` in this test, as the `ExtensionStore` class doesn't use them.
    manifestFlags,
  };
}
