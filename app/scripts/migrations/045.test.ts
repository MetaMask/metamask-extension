import migration45 from './045';

type MigrationInput = Parameters<typeof migration45.migrate>[0];

describe('migration #45', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 44,
      },
      data: {},
    };

    const newStorage = await migration45.migrate(
      oldStorage as unknown as MigrationInput,
    );
    expect(newStorage.meta).toStrictEqual({
      version: 45,
    });
  });

  it('should update ipfsGateway value if outdated', async () => {
    const oldStorage = {
      meta: { version: 44 },
      data: {
        PreferencesController: {
          ipfsGateway: 'ipfs.dweb.link',
          bar: 'baz',
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration45.migrate(
      oldStorage as unknown as MigrationInput,
    );
    expect(newStorage.data).toStrictEqual({
      PreferencesController: {
        ipfsGateway: 'dweb.link',
        bar: 'baz',
      },
      foo: 'bar',
    });
  });

  it('should not update ipfsGateway value if custom set', async () => {
    const oldStorage = {
      meta: { version: 44 },
      data: {
        PreferencesController: {
          ipfsGateway: 'blah',
          bar: 'baz',
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration45.migrate(
      oldStorage as unknown as MigrationInput,
    );

    expect(newStorage.data).toStrictEqual({
      PreferencesController: {
        ipfsGateway: 'blah',
        bar: 'baz',
      },
      foo: 'bar',
    });
  });

  it('should do nothing if no PreferencesController key', async () => {
    const oldStorage = {
      meta: { version: 44 },
      data: {
        foo: 'bar',
      },
    };

    const newStorage = await migration45.migrate(
      oldStorage as unknown as MigrationInput,
    );

    expect(newStorage.data).toStrictEqual({
      foo: 'bar',
    });
  });
});
