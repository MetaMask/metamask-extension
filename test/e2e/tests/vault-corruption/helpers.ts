import { type ManifestFlags } from '../../../../shared/lib/manifestFlags';

/**
 * Simple script that reloads the extension.
 * Used when manifest flags (like simulateStorageGetFailure, simulateInitializationHang)
 * handle the corruption/failure simulation.
 */
export const simpleReloadScript = `
  const callback = arguments[arguments.length - 1];
  const browser = globalThis.browser ?? globalThis.chrome;
  browser.runtime.reload();
  callback();
`;

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
