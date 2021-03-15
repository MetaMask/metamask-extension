import { strict as assert } from 'assert';
import migration46 from './046';

describe('migration #46', function () {
  it('should update the version metadata', async function () {
    const oldStorage = {
      meta: {
        version: 45,
      },
      data: {},
    };

    const newStorage = await migration46.migrate(oldStorage);
    assert.deepEqual(newStorage.meta, {
      version: 46,
    });
  });

  it('should delete ABTestController state', async function () {
    const oldStorage = {
      meta: {},
      data: {
        ABTestController: {
          abTests: {
            fullScreenVsPopup: 'control',
          },
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration46.migrate(oldStorage);
    assert.deepEqual(newStorage.data, {
      foo: 'bar',
    });
  });

  it('should do nothing if ABTestController state does not exist', async function () {
    const oldStorage = {
      meta: {},
      data: {
        AppStateController: {
          bar: 'baz',
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration46.migrate(oldStorage);
    assert.deepEqual(oldStorage.data, newStorage.data);
  });
});
