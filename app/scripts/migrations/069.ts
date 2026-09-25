/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any -- Legacy migration state remains loosely typed during JS-to-TS conversion. */
import { SubjectType } from '@metamask/permission-controller';
import { cloneDeep } from 'lodash';

type LegacyState = Record<string, any>;
type VersionedData = { meta: { version?: number }; data?: LegacyState };

const version = 69;

/**
 * Adds the `subjectType` property to all subject metadata.
 */
const migration = {
  version,
  async migrate(originalVersionedData: VersionedData) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    const state = (versionedData.data ?? {}) as LegacyState;
    const newState = transformState(state);
    versionedData.data = newState;
    return versionedData;
  },
};

export default migration;

function transformState(state: LegacyState) {
  if (typeof state?.SubjectMetadataController?.subjectMetadata === 'object') {
    const {
      SubjectMetadataController: { subjectMetadata },
    } = state;

    // mutate SubjectMetadataController.subjectMetadata in place
    Object.values(subjectMetadata).forEach((metadata) => {
      if (
        metadata &&
        typeof metadata === 'object' &&
        !Array.isArray(metadata)
      ) {
        metadata.subjectType = metadata.extensionId
          ? SubjectType.Extension
          : SubjectType.Website;
      }
    });
  }
  return state;
}
