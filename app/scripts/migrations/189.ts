import { hasProperty } from '@metamask/utils';
import type { Migrate } from './types';

export const version = 189;

export const migrate = (async (versionedData, changedKeys) => {
  versionedData.meta.version = version;

  if (
    hasProperty(versionedData.data, 'seedPhrase') &&
    versionedData.data.seedPhrase === null
  ) {
    delete versionedData.data.seedPhrase;
    changedKeys.add('seedPhrase');
  }
}) satisfies Migrate;
