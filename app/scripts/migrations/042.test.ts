import migration42 from './042';

type MigrationInput = Parameters<typeof migration42.migrate>[0];

describe('migration #42', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 41,
      },
      data: {},
    };

    const newStorage = await migration42.migrate(
      oldStorage as unknown as MigrationInput,
    );
    expect(newStorage.meta.version).toStrictEqual(42);
  });

  it('should set connectedStatusPopoverHasBeenShown to false', async () => {
    const oldStorage = {
      meta: { version: 41 },
      data: {
        AppStateController: {
          connectedStatusPopoverHasBeenShown: true,
          bar: 'baz',
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration42.migrate(
      oldStorage as unknown as MigrationInput,
    );
    expect(newStorage.data).toStrictEqual({
      AppStateController: {
        connectedStatusPopoverHasBeenShown: false,
        bar: 'baz',
      },
      foo: 'bar',
    });
  });

  it('should initialize AppStateController if it does not exist', async () => {
    const oldStorage = {
      meta: { version: 41 },
      data: {
        foo: 'bar',
      },
    };

    const newStorage = await migration42.migrate(
      oldStorage as unknown as MigrationInput,
    );
    expect(newStorage.data).toStrictEqual({
      foo: 'bar',
      AppStateController: {
        connectedStatusPopoverHasBeenShown: false,
      },
    });
  });
});
