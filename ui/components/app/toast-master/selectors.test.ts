import { StorageWriteErrorType } from '../../../../shared/constants/app-state';
import { selectStorageWriteErrorType } from './selectors';

describe('#selectStorageWriteErrorType', () => {
  it('returns null when storageWriteErrorType is not set', () => {
    const state = {
      metamask: {},
    };

    const result = selectStorageWriteErrorType(state);

    expect(result).toBeNull();
  });

  it('returns StorageWriteErrorType.Default when storageWriteErrorType is default', () => {
    const state = {
      metamask: {
        storageWriteErrorType: StorageWriteErrorType.Default,
      },
    };

    const result = selectStorageWriteErrorType(state);

    expect(result).toBe(StorageWriteErrorType.Default);
  });

  it('returns StorageWriteErrorType.FileErrorNoSpace when storageWriteErrorType is file-error-no-space', () => {
    const state = {
      metamask: {
        storageWriteErrorType: StorageWriteErrorType.FileErrorNoSpace,
      },
    };

    const result = selectStorageWriteErrorType(state);

    expect(result).toBe(StorageWriteErrorType.FileErrorNoSpace);
  });
});
