import { strict as assert } from 'assert';
import migration58 from './058';

describe('migration #58', function () {
  it('should update the version metadata', async function () {
    const oldStorage = {
      meta: {
        version: 57,
      },
      data: {},
    };

    const newStorage = await migration58.migrate(oldStorage);
    assert.deepEqual(newStorage.meta, {
      version: 58,
    });
  });

  describe('deleting swapsWelcomeMessageHasBeenShown', function () {
    it('should delete the swapsWelcomeMessageHasBeenShown property', async function () {
      const oldStorage = {
        meta: {},
        data: {
          AppStateController: {
            swapsWelcomeMessageHasBeenShown: false,
            bar: 'baz',
          },
          foo: 'bar',
        },
      };
      const newStorage = await migration58.migrate(oldStorage);
      assert.deepEqual(newStorage.data.AppStateController, { bar: 'baz' });
    });

    it('should not modify state if the AppStateController does not exist', async function () {
      const oldStorage = {
        meta: {},
        data: {
          foo: 'bar',
        },
      };
      const newStorage = await migration58.migrate(oldStorage);
      assert.deepEqual(newStorage.data, oldStorage.data);
    });
  });
});
