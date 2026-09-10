import browser from 'webextension-polyfill';
import { isManifestV3 } from '../mv3.utils';

const STORAGE_KEY_PREFIX = 'deepLinkNavigationTrace:';
export const PENDING_DEEP_LINK_TTL = 5 * 60 * 1000;
const VARIANT_PATTERN = /^[a-z][a-z-]{0,23}$/u;

export type DeepLinkUrlTags = {
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Sentry snake_case
  deeplink_route: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Sentry snake_case
  deeplink_variant: string;
  signed: boolean;
};

export type PendingDeepLinkNavigation = {
  id: string;
  intakeTimestamp: number;
  createdAt: number;
  urlTags: DeepLinkUrlTags;
  targetRoute: string;
  interstitial: 'shown' | 'skipped';
};

type StorageArea = typeof browser.storage.local;

function getStorageArea(): StorageArea {
  if (isManifestV3 && browser.storage.session) {
    return browser.storage.session;
  }
  return browser.storage.local;
}

function getStorageKey(tabId: number): string {
  return `${STORAGE_KEY_PREFIX}${tabId}`;
}

function isDeepLinkUrlTags(value: unknown): value is DeepLinkUrlTags {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const tags = value as Partial<DeepLinkUrlTags>;
  return (
    typeof tags.deeplink_route === 'string' &&
    typeof tags.deeplink_variant === 'string' &&
    typeof tags.signed === 'boolean'
  );
}

function isPendingDeepLinkNavigation(
  value: unknown,
): value is PendingDeepLinkNavigation {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Partial<PendingDeepLinkNavigation>;
  return (
    typeof record.id === 'string' &&
    typeof record.intakeTimestamp === 'number' &&
    typeof record.createdAt === 'number' &&
    isDeepLinkUrlTags(record.urlTags) &&
    typeof record.targetRoute === 'string' &&
    (record.interstitial === 'shown' || record.interstitial === 'skipped')
  );
}

export function getDeepLinkUrlTags(urlString: string): DeepLinkUrlTags {
  try {
    const url = new URL(urlString);
    const route =
      url.pathname.split('/').find((segment) => segment.length > 0) ??
      url.hostname ??
      'unknown';
    const variant =
      url.searchParams.get('screen') ?? url.searchParams.get('tab');

    return {
      // eslint-disable-next-line @typescript-eslint/naming-convention -- Sentry snake_case
      deeplink_route: route || 'unknown',
      // eslint-disable-next-line @typescript-eslint/naming-convention -- Sentry snake_case
      deeplink_variant:
        variant && VARIANT_PATTERN.test(variant) ? variant : 'default',
      signed: url.searchParams.has('sig'),
    };
  } catch {
    return {
      // eslint-disable-next-line @typescript-eslint/naming-convention -- Sentry snake_case
      deeplink_route: 'unknown',
      // eslint-disable-next-line @typescript-eslint/naming-convention -- Sentry snake_case
      deeplink_variant: 'default',
      signed: false,
    };
  }
}

export async function setPendingDeepLinkNavigation(
  tabId: number,
  record: PendingDeepLinkNavigation,
): Promise<void> {
  await getStorageArea().set({ [getStorageKey(tabId)]: record });
}

export async function getPendingDeepLinkNavigation(
  tabId: number,
): Promise<PendingDeepLinkNavigation | null> {
  const key = getStorageKey(tabId);
  const result = await getStorageArea().get(key);
  const record = result[key];

  if (!isPendingDeepLinkNavigation(record)) {
    return null;
  }

  if (Date.now() - record.createdAt > PENDING_DEEP_LINK_TTL) {
    await removePendingDeepLinkNavigation(tabId, record.id);
    return null;
  }

  return record;
}

export async function removePendingDeepLinkNavigation(
  tabId: number,
  expectedId: string,
): Promise<void> {
  const record = await getPendingDeepLinkNavigationWithoutExpiry(tabId);
  if (record?.id === expectedId) {
    await getStorageArea().remove(getStorageKey(tabId));
  }
}

export async function clearPendingDeepLinkNavigation(
  tabId: number,
): Promise<void> {
  await getStorageArea().remove(getStorageKey(tabId));
}

async function getPendingDeepLinkNavigationWithoutExpiry(
  tabId: number,
): Promise<PendingDeepLinkNavigation | null> {
  const key = getStorageKey(tabId);
  const result = await getStorageArea().get(key);
  const record = result[key];
  return isPendingDeepLinkNavigation(record) ? record : null;
}

export async function removeExpiredPendingDeepLinkNavigations(): Promise<void> {
  if (isManifestV3) {
    return;
  }

  const storageArea = browser.storage.local;
  if (!storageArea.getKeys) {
    return;
  }

  const keys = (await storageArea.getKeys()).filter((key) =>
    key.startsWith(STORAGE_KEY_PREFIX),
  );
  if (keys.length === 0) {
    return;
  }

  const records = await storageArea.get(keys);
  const expiredKeys = keys.filter((key) => {
    const record = records[key];
    return (
      !isPendingDeepLinkNavigation(record) ||
      Date.now() - record.createdAt > PENDING_DEEP_LINK_TTL
    );
  });
  if (expiredKeys.length > 0) {
    await storageArea.remove(expiredKeys);
  }
}

export async function getCurrentTabId(): Promise<number | null> {
  const tab = await browser.tabs.getCurrent();
  return tab?.id ?? null;
}
