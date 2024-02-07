import { SubjectType } from '@metamask/permission-controller';
import { cloneDeep } from 'lodash';

const version = 69;

/**
 * Adds the `subjectType` property to all subject metadata.
 */
export default {
  version,
  async migrate(originalVersionedData) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    const state = versionedData.data;
    const newState = transformState(state);
    versionedData.data = newState;
    return versionedData;
  },
};

function transformState(state) {
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
