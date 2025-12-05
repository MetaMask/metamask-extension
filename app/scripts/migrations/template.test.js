import { migrate, version } from './template';

const storage = {
  meta: { version: -1 },
  data: {
    ControllerKey: {},
    OldControllerKey: {},
  },
};

describe('storage is migrated successfully', () => {
  it('should work', async () => {
    const changedKeys = new Set();
    await migrate(storage, changedKeys);
    expect(storage.meta.version).toStrictEqual(version);
    // ensure changedKeys has only 'ControllerKey' and 'OldControllerKey'
    expect(changedKeys).toStrictEqual(
      new Set(['ControllerKey', 'OldControllerKey']),
    );
  });
});
