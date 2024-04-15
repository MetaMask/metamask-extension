import { cloneDeep } from 'lodash';
import { hasProperty, isObject } from '@metamask/utils';
import log from 'loglevel';

export const version = 92;

/**
 * Delete `stalelistLastFetched` and `hotlistLastFetched` to force a phishing configuration refresh
 * because the format has changed.
 *
 * @param originalVersionedData - Versioned MetaMask extension state, exactly what we persist to dist.
 * @param originalVersionedData.meta - State metadata.
 * @param originalVersionedData.meta.version - The current state version.
 * @param originalVersionedData.data - The persisted MetaMask state, keyed by controller.
 * @returns Updated versioned MetaMask extension state.
 */
export async function migrate(originalVersionedData: {
  meta: { version: number };
  data: Record<string, unknown>;
}) {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;
  versionedData.data = transformState(versionedData.data);
  return versionedData;
}

function transformState(state: Record<string, unknown>) {
  if (
    hasProperty(state, 'PhishingController') &&
    isObject(state.PhishingController)
  ) {
    delete state.PhishingController.stalelistLastFetched;
    delete state.PhishingController.hotlistLastFetched;
  } else if (hasProperty(state, 'PhishingController')) {
    global.sentry?.captureException?.(
      new Error(
        `typeof state.PhishingController is ${typeof state.PhishingController}`,
      ),
    );
  } else {
    log.warn(`typeof state.PhishingController is undefined`);
  }
  return state;
}
