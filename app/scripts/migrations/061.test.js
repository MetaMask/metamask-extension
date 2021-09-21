import sinon from 'sinon';
import migration61 from './061';

describe('migration #61', () => {
  let dateStub;

  beforeEach(() => {
    dateStub = sinon.stub(Date.prototype, 'getTime').returns(1621580400000);
  });

  afterEach(() => {
    dateStub.restore();
  });

  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 60,
      },
      data: {},
    };

    const newStorage = await migration61.migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({
      version: 61,
    });
  });

  it('should set recoveryPhraseReminderHasBeenShown to false and recoveryPhraseReminderLastShown to the current time', async () => {
    const oldStorage = {
      meta: {},
      data: {
        AppStateController: {
          existingProperty: 'foo',
        },
      },
    };

    const newStorage = await migration61.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      AppStateController: {
        recoveryPhraseReminderHasBeenShown: false,
        recoveryPhraseReminderLastShown: 1621580400000,
        existingProperty: 'foo',
      },
    });
  });

  it('should initialize AppStateController if it does not exist', async () => {
    const oldStorage = {
      meta: {},
      data: {
        existingProperty: 'foo',
      },
    };

    const newStorage = await migration61.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      existingProperty: 'foo',
      AppStateController: {
        recoveryPhraseReminderHasBeenShown: false,
        recoveryPhraseReminderLastShown: 1621580400000,
      },
    });
  });
});
