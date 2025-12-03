import { migrate, version } from './template';

const storage = {
  meta: { version: -1 },
  data: {},
};

describe('storage is migrated successfully', () => {
  it('should work', async () => {
    const changedKeys = new Set();
    await migrate(storage, changedKeys);
    expect(storage.meta.version).toStrictEqual(version);
    expect([...changedKeys.keys()]).toBe(['ControllerKey', 'OldControllerKey']);
  });
});
