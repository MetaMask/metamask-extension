import browser from 'webextension-polyfill';
import type { Json } from '@metamask/utils';
import { BrowserStorageAdapter } from './stores/browser-storage-adapter';

export const SPLIT_STATE_MIGRATION_ENABLED_KEY = 'splitStateMigrationEnabled';
export const SPLIT_STATE_MIGRATION_MAX_ACCOUNTS_KEY =
  'splitStateMigrationMaxAccounts';
export const SPLIT_STATE_MIGRATION_MAX_NETWORKS_KEY =
  'splitStateMigrationMaxNetworks';

const SPLIT_STATE_MIGRATION_OVERRIDE_NAMESPACE =
  'SplitStateMigrationDevOverrides';

export const SPLIT_STATE_MIGRATION_OVERRIDE_KEYS = [
  SPLIT_STATE_MIGRATION_ENABLED_KEY,
  SPLIT_STATE_MIGRATION_MAX_ACCOUNTS_KEY,
  SPLIT_STATE_MIGRATION_MAX_NETWORKS_KEY,
] as const;

export type SplitStateMigrationDeveloperOverrideKey =
  (typeof SPLIT_STATE_MIGRATION_OVERRIDE_KEYS)[number];

export type SplitStateMigrationDeveloperOverrides = Record<
  SplitStateMigrationDeveloperOverrideKey,
  Json | undefined
>;

type GeneratedDeveloperOverride = {
  key: SplitStateMigrationDeveloperOverrideKey;
  value: Json | undefined;
  hasGeneratedState: boolean;
};

const storageAdapter = new BrowserStorageAdapter();

async function getLegacyDeveloperOverride(
  key: SplitStateMigrationDeveloperOverrideKey,
): Promise<Json | undefined> {
  try {
    const result = await browser.storage.local.get(key);
    return result[key] as Json | undefined;
  } catch {
    return undefined;
  }
}

async function getGeneratedDeveloperOverride(
  key: SplitStateMigrationDeveloperOverrideKey,
): Promise<GeneratedDeveloperOverride> {
  const generatedOverride = await storageAdapter.getGeneratedItem(
    SPLIT_STATE_MIGRATION_OVERRIDE_NAMESPACE,
    key,
  );

  if ('result' in generatedOverride) {
    return {
      key,
      value: generatedOverride.result,
      hasGeneratedState: true,
    };
  }

  return {
    key,
    value: undefined,
    hasGeneratedState: Boolean(generatedOverride.error),
  };
}

function toDeveloperOverrides(
  entries: [SplitStateMigrationDeveloperOverrideKey, Json | undefined][],
): SplitStateMigrationDeveloperOverrides {
  return Object.fromEntries(entries) as SplitStateMigrationDeveloperOverrides;
}

export async function getSplitStateMigrationDeveloperOverrides(): Promise<SplitStateMigrationDeveloperOverrides> {
  const hasGeneratedOverrideState =
    await storageAdapter.hasGeneratedNamespaceState(
      SPLIT_STATE_MIGRATION_OVERRIDE_NAMESPACE,
      [...SPLIT_STATE_MIGRATION_OVERRIDE_KEYS],
    );

  if (hasGeneratedOverrideState) {
    const generatedOverrides = await Promise.all(
      SPLIT_STATE_MIGRATION_OVERRIDE_KEYS.map((key) =>
        getGeneratedDeveloperOverride(key),
      ),
    );
    return toDeveloperOverrides(
      generatedOverrides.map(({ key, value }) => [key, value]),
    );
  }

  return toDeveloperOverrides(
    await Promise.all(
      SPLIT_STATE_MIGRATION_OVERRIDE_KEYS.map(async (key) => [
        key,
        await getLegacyDeveloperOverride(key),
      ]),
    ),
  );
}

export async function getSplitStateMigrationDeveloperOverride(
  key: SplitStateMigrationDeveloperOverrideKey,
): Promise<Json | undefined> {
  return (await getSplitStateMigrationDeveloperOverrides())[key];
}

export async function setSplitStateMigrationDeveloperOverride(
  key: SplitStateMigrationDeveloperOverrideKey,
  value: Json,
): Promise<void> {
  await storageAdapter.setItem(
    SPLIT_STATE_MIGRATION_OVERRIDE_NAMESPACE,
    key,
    value,
  );
}

export async function unsetSplitStateMigrationDeveloperOverride(
  key: SplitStateMigrationDeveloperOverrideKey,
): Promise<void> {
  await setSplitStateMigrationDeveloperOverride(key, null);
}
