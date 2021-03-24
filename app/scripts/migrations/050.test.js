import { strict as assert } from 'assert';
import sinon from 'sinon';
import migration50 from './050';

const LEGACY_LOCAL_STORAGE_KEYS = [
  'METASWAP_GAS_PRICE_ESTIMATES_LAST_RETRIEVED',
  'METASWAP_GAS_PRICE_ESTIMATES',
  'cachedFetch',
  'BASIC_PRICE_ESTIMATES_LAST_RETRIEVED',
  'BASIC_PRICE_ESTIMATES',
  'BASIC_GAS_AND_TIME_API_ESTIMATES',
  'BASIC_GAS_AND_TIME_API_ESTIMATES_LAST_RETRIEVED',
  'GAS_API_ESTIMATES_LAST_RETRIEVED',
  'GAS_API_ESTIMATES',
];

describe('migration #50', function () {
  let mockLocalStorageRemoveItem;

  beforeEach(function () {
    mockLocalStorageRemoveItem = sinon.stub(window.localStorage, 'removeItem');
  });

  afterEach(function () {
    sinon.restore();
  });

  it('should update the version metadata', async function () {
    const oldStorage = {
      meta: {
        version: 49,
      },
      data: {},
    };

    const newStorage = await migration50.migrate(oldStorage);
    assert.deepEqual(newStorage.meta, {
      version: 50,
    });
  });

  it('should call window.localStorage.removeItem for each legacy key', async function () {
    const oldStorage = {
      meta: {
        version: 49,
      },
      data: {},
    };

    await migration50.migrate(oldStorage);
    assert.equal(mockLocalStorageRemoveItem.callCount, 9);
    assert.equal(
      mockLocalStorageRemoveItem.getCall(0).args[0],
      LEGACY_LOCAL_STORAGE_KEYS[0],
    );
    assert.equal(
      mockLocalStorageRemoveItem.getCall(1).args[0],
      LEGACY_LOCAL_STORAGE_KEYS[1],
    );
    assert.equal(
      mockLocalStorageRemoveItem.getCall(2).args[0],
      LEGACY_LOCAL_STORAGE_KEYS[2],
    );
    assert.equal(
      mockLocalStorageRemoveItem.getCall(3).args[0],
      LEGACY_LOCAL_STORAGE_KEYS[3],
    );
    assert.equal(
      mockLocalStorageRemoveItem.getCall(4).args[0],
      LEGACY_LOCAL_STORAGE_KEYS[4],
    );
    assert.equal(
      mockLocalStorageRemoveItem.getCall(5).args[0],
      LEGACY_LOCAL_STORAGE_KEYS[5],
    );
    assert.equal(
      mockLocalStorageRemoveItem.getCall(6).args[0],
      LEGACY_LOCAL_STORAGE_KEYS[6],
    );
    assert.equal(
      mockLocalStorageRemoveItem.getCall(7).args[0],
      LEGACY_LOCAL_STORAGE_KEYS[7],
    );
    assert.equal(
      mockLocalStorageRemoveItem.getCall(8).args[0],
      LEGACY_LOCAL_STORAGE_KEYS[8],
    );
  });
});
