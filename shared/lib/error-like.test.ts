import { StateCorruptionErrorType } from '../constants/critical-error';
import { getErrorBackup, getErrorLike } from './error-like';

describe('getErrorLike', () => {
  it('serializes Error instances', () => {
    const error = new Error('boom');

    expect(getErrorLike(error)).toStrictEqual({
      message: 'boom',
      name: 'Error',
      stack: expect.any(String),
    });
  });

  it('serializes non-error thrown values', () => {
    expect(getErrorLike('boom')).toStrictEqual({
      message: 'boom',
      name: 'UnknownError',
      stack: '',
    });
  });

  it('preserves cause', () => {
    const cause = new Error('storage failed');
    const error = Object.assign(new Error('corrupt'), {
      cause,
    });

    expect(getErrorLike(error)).toStrictEqual({
      message: 'corrupt',
      name: 'Error',
      stack: expect.any(String),
      cause: {
        message: 'storage failed',
        name: 'Error',
        stack: expect.any(String),
      },
    });
  });

  it('preserves sentryTags', () => {
    const error = Object.assign(new Error('migration failed'), {
      sentryTags: {
        'corruption.preMigrationVersion': '157',
        'corruption.backupShouldExist': 'true',
      },
    });

    expect(getErrorLike(error)).toStrictEqual({
      message: 'migration failed',
      name: 'Error',
      stack: expect.any(String),
      sentryTags: {
        'corruption.preMigrationVersion': '157',
        'corruption.backupShouldExist': 'true',
      },
    });
  });

  it('preserves state corruption error types', () => {
    const error = Object.assign(new Error('display message'), {
      name: 'PersistenceError',
      corruptionType: StateCorruptionErrorType.InaccessibleDatabase,
    });

    expect(getErrorLike(error)).toStrictEqual({
      message: 'display message',
      name: 'PersistenceError',
      stack: expect.any(String),
      corruptionType: StateCorruptionErrorType.InaccessibleDatabase,
    });
  });

  it('omits unrecognized state corruption error types', () => {
    const error = Object.assign(new Error('display message'), {
      corruptionType: 'unknown_corruption_type',
    });

    expect(getErrorLike(error)).not.toHaveProperty('corruptionType');
  });

  it('does not materialize PersistenceError getBackup on the error', () => {
    const backup = {
      KeyringController: { vault: 'encrypted-vault-data' },
    };
    const error = Object.assign(new Error('missing vault'), {
      name: 'PersistenceError',
      getBackup: () => backup,
    });

    expect(getErrorLike(error)).toStrictEqual({
      message: 'missing vault',
      name: 'PersistenceError',
      stack: expect.any(String),
    });
  });
});

describe('getErrorBackup', () => {
  it('returns a PersistenceError backup separately from the error', () => {
    const backup = {
      KeyringController: { vault: 'encrypted-vault-data' },
    };
    const error = Object.assign(new Error('missing vault'), {
      getBackup: () => backup,
    });

    expect(getErrorBackup(error)).toBe(backup);
    expect(getErrorLike(error)).not.toHaveProperty('backup');
  });

  it('returns undefined when getBackup throws or returns null', () => {
    const throwingError = Object.assign(new Error('missing vault'), {
      getBackup: () => {
        throw new Error('no backup');
      },
    });
    expect(getErrorBackup(throwingError)).toBeUndefined();

    const nullBackupError = Object.assign(new Error('missing vault'), {
      getBackup: () => null,
    });
    expect(getErrorBackup(nullBackupError)).toBeUndefined();
  });
});
