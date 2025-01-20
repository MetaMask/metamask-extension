import { migrate, version } from './138';

const oldVersion = 137;

describe(`migration #${version}`, () => {
  it('updates the version number', async () => {
    const oldData = {
      meta: { version: oldVersion },
      data: {},
    };
    const newData = await migrate(oldData);
    expect(newData.meta.version).toBe(version);
  });

  it('leaves state unchanged when KeyringController is missing', async () => {
    const oldData = {
      meta: { version: oldVersion },
      data: {
        foo: 'bar',
      },
    };
    // @ts-expect-error testing error
    const newData = await migrate(oldData);
    expect(newData.data).toEqual(oldData.data);
  });

  it('adds keyringsMetadata when KeyringController exists with empty metadata', async () => {
    const oldData = {
      meta: { version: oldVersion },
      data: {
        KeyringController: {
          keyrings: [{ type: 'HD Key Tree' }, { type: 'Simple Key Pair' }],
          keyringsMetadata: [],
        },
      },
    };
    // @ts-expect-error testing error
    const newData = await migrate(oldData);
    expect(newData.data.KeyringController?.keyringsMetadata).toHaveLength(2);
    expect(newData.data.KeyringController?.keyringsMetadata[0]).toHaveProperty(
      'id',
    );
    expect(newData.data.KeyringController?.keyringsMetadata[0]).toHaveProperty(
      'name',
      'HD Key Tree',
    );
  });

  it('adds keyringsMetadata when KeyringController exists with undefined metadata', async () => {
    const oldData = {
      meta: { version: oldVersion },
      data: {
        KeyringController: {
          keyrings: [{ type: 'HD Key Tree' }],
        },
      },
    };
    // @ts-expect-error testing when keyringsMetadata is undefined
    const newData = await migrate(oldData);
    expect(newData.data.KeyringController?.keyringsMetadata).toHaveLength(1);
    expect(newData.data.KeyringController?.keyringsMetadata[0]).toHaveProperty(
      'name',
      'HD Key Tree',
    );
  });

  it('preserves existing keyringsMetadata', async () => {
    const existingMetadata = [{ id: '123', name: 'Existing' }];
    const oldData = {
      meta: { version: oldVersion },
      data: {
        KeyringController: {
          isUnlocked: true,
          keyrings: [{ type: 'HD Key Tree', accounts: [] }],
          keyringsMetadata: existingMetadata,
        },
      },
    };
    const newData = await migrate(oldData);
    expect(newData.data.KeyringController?.keyringsMetadata).toEqual(
      existingMetadata,
    );
  });
});
