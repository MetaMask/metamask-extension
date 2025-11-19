type VersionedData = {
  meta: { version: number; storageKind?: string };
  data: Record<string, unknown>;
};

export const version = 183;

/**
 * Test migration for adding
 *
 * @param versionedData - Versioned MetaMask extension state, exactly
 * what we persist to dist.
 * @param versionedData.meta - State metadata.
 * @param versionedData.meta.version - The current state version.
 * @param versionedData.meta.storageKind - The current storage kind.
 * @param versionedData.data - The persisted MetaMask state, keyed by
 * controller.
 * @param changeset
 */
export async function migrate(
  versionedData: VersionedData,
  changeset: Set<string>,
): Promise<void> {
  versionedData.meta.version = version;
  versionedData.meta.storageKind = 'data';
  changeset.add('meta');
}
