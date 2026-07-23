import { getErrorLike } from './error-like';

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
});
