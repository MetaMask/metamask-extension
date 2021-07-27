import { strict as assert } from 'assert';
import sinon from 'sinon';
import migration61 from './061';

describe('migration #61', function () {
  let dateStub;

  beforeEach(function () {
    dateStub = sinon.stub(Date.prototype, 'getTime').returns(1621580400000);
  });

  afterEach(function () {
    dateStub.restore();
  });

  it('should update the version metadata', async function () {
    const oldStorage = {
      meta: {
        version: 60,
      },
      data: {},
    };

    const newStorage = await migration61.migrate(oldStorage);
    assert.deepEqual(newStorage.meta, {
      version: 61,
    });
  });

  it('should set recoveryPhraseReminderHasBeenShown to false and recoveryPhraseReminderLastShown to the current time', async function () {
    const oldStorage = {
      meta: {},
      data: {
        AppStateController: {
          existingProperty: 'foo',
        },
      },
    };

    const newStorage = await migration61.migrate(oldStorage);
    assert.deepEqual(newStorage.data, {
      AppStateController: {
        recoveryPhraseReminderHasBeenShown: false,
        recoveryPhraseReminderLastShown: 1621580400000,
        existingProperty: 'foo',
      },
    });
  });

  it('should initialize AppStateController if it does not exist', async function () {
    const oldStorage = {
      meta: {},
      data: {
        existingProperty: 'foo',
      },
    };

    const newStorage = await migration61.migrate(oldStorage);
    assert.deepEqual(newStorage.data, {
      existingProperty: 'foo',
      AppStateController: {
        recoveryPhraseReminderHasBeenShown: false,
        recoveryPhraseReminderLastShown: 1621580400000,
      },
    });
  });
});
