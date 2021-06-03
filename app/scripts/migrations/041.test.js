import { strict as assert } from 'assert';
import migration41 from './041';

describe('migration #41', function () {
  it('should update the version metadata', function (done) {
    const oldStorage = {
      meta: {
        version: 40,
      },
      data: {},
    };

    migration41
      .migrate(oldStorage)
      .then((newStorage) => {
        assert.deepEqual(newStorage.meta, {
          version: 41,
        });
        done();
      })
      .catch(done);
  });

  it('should rename autoLogoutTimeLimit storage key', function (done) {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          preferences: {
            autoLogoutTimeLimit: 42,
            fizz: 'buzz',
          },
          bar: 'baz',
        },
        foo: 'bar',
      },
    };

    migration41
      .migrate(oldStorage)
      .then((newStorage) => {
        assert.deepEqual(newStorage.data, {
          PreferencesController: {
            preferences: {
              autoLockTimeLimit: 42,
              fizz: 'buzz',
            },
            bar: 'baz',
          },
          foo: 'bar',
        });
        done();
      })
      .catch(done);
  });

  it('should do nothing if no PreferencesController key', function (done) {
    const oldStorage = {
      meta: {},
      data: {
        foo: 'bar',
      },
    };

    migration41
      .migrate(oldStorage)
      .then((newStorage) => {
        assert.deepEqual(newStorage.data, {
          foo: 'bar',
        });
        done();
      })
      .catch(done);
  });

  it('should do nothing if no preferences key', function (done) {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          bar: 'baz',
        },
        foo: 'bar',
      },
    };

    migration41
      .migrate(oldStorage)
      .then((newStorage) => {
        assert.deepEqual(newStorage.data, {
          PreferencesController: {
            bar: 'baz',
          },
          foo: 'bar',
        });
        done();
      })
      .catch(done);
  });
});
