import { migrate, version, VersionedData } from './137';

const oldVersion = 136;

describe(`migration #${version}`, () => {
  it('updates the version metadata', async () => {
    const oldStorage: VersionedData = {
      meta: { version: oldVersion },
      data: {},
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({ version });
  });
});
