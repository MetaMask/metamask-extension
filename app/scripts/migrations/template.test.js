import { migrate, version } from './template';

const storage = {
  meta: { version: -1 },
  data: {},
};

describe('storage is migrated successfully', () => {
  it('should work', async () => {
    const migratedData = await migrate(storage);
    expect(migratedData.meta.version).toStrictEqual(version);
  });
});
