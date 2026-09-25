import migration46 from './046';

type MigrationInput = Parameters<typeof migration46.migrate>[0];

describe('migration #46', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 45,
      },
      data: {},
    };

    const newStorage = await migration46.migrate(
      oldStorage as unknown as MigrationInput,
    );
    expect(newStorage.meta).toStrictEqual({
      version: 46,
    });
  });

  it('should delete ABTestController state', async () => {
    const oldStorage = {
      meta: { version: 45 },
      data: {
        ABTestController: {
          abTests: {
            fullScreenVsPopup: 'control',
          },
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration46.migrate(
      oldStorage as unknown as MigrationInput,
    );
    expect(newStorage.data).toStrictEqual({
      foo: 'bar',
    });
  });

  it('should do nothing if ABTestController state does not exist', async () => {
    const oldStorage = {
      meta: { version: 45 },
      data: {
        AppStateController: {
          bar: 'baz',
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration46.migrate(
      oldStorage as unknown as MigrationInput,
    );
    expect(oldStorage.data).toStrictEqual(newStorage.data);
  });
});
