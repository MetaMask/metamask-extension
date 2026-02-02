/**
 * Returns the config for database/vault corruption tests.
 *
 * @param title - The title of the test.
 * @param options - Additional options.
 * @param options.additionalIgnoredErrors - Additional console errors to ignore.
 * @param options.additionalManifestFlags - Additional manifest testing flags.
 * @returns The test configuration object.
 */
export function getConfig(
  title?: string,
  options: {
    additionalIgnoredErrors?: string[];
    additionalManifestFlags?: Record<string, unknown>;
  } = {},
) {
  const { additionalIgnoredErrors = [], additionalManifestFlags = {} } =
    options;

  return {
    title,
    ignoredConsoleErrors: [
      // Expected error caused by breaking the database:
      'PersistenceError: Data error: storage.local does not contain vault data',
      ...additionalIgnoredErrors,
    ],
    // This flag ultimately requires that we onboard manually, as we can't use
    // `fixtures` in this test, as the `ExtensionStore` class doesn't use them.
    manifestFlags: {
      testing: {
        forceExtensionStore: true,
        ...additionalManifestFlags,
      },
    },
  };
}
