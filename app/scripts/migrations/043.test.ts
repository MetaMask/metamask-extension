import migration43 from './043';

type MigrationInput = Parameters<typeof migration43.migrate>[0];

describe('migration #43', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 42,
      },
      data: {},
    };

    const newStorage = await migration43.migrate(
      oldStorage as unknown as MigrationInput,
    );
    expect(newStorage.meta).toStrictEqual({
      version: 43,
    });
  });

  it('should delete currentAccountTab state', async () => {
    const oldStorage = {
      meta: { version: 42 },
      data: {
        PreferencesController: {
          currentAccountTab: 'history',
          bar: 'baz',
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration43.migrate(
      oldStorage as unknown as MigrationInput,
    );
    expect(newStorage.data).toStrictEqual({
      PreferencesController: {
        bar: 'baz',
      },
      foo: 'bar',
    });
  });

  it('should do nothing if currentAccountTab state does not exist', async () => {
    const oldStorage = {
      meta: { version: 42 },
      data: {
        PreferencesController: {
          bar: 'baz',
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration43.migrate(
      oldStorage as unknown as MigrationInput,
    );
    expect(oldStorage.data).toStrictEqual(newStorage.data);
  });
});
