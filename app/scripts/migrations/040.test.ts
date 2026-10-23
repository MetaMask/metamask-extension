import migration40 from './040';

type MigrationInput = Parameters<typeof migration40.migrate>[0];

describe('migration #40', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 39,
      },
      data: {},
    };

    const newStorage = await migration40.migrate(
      oldStorage as unknown as MigrationInput,
    );
    expect(newStorage.meta?.version).toStrictEqual(40);
  });

  it('should delete ProviderApprovalController storage key', async () => {
    const oldStorage = {
      meta: { version: 39 },
      data: {
        ProviderApprovalController: {},
        foo: 'bar',
      },
    };

    const newStorage = await migration40.migrate(
      oldStorage as unknown as MigrationInput,
    );
    expect(newStorage.data).toStrictEqual({
      foo: 'bar',
    });
  });

  it('should do nothing if no ProviderApprovalController storage key', async () => {
    const oldStorage = {
      meta: { version: 39 },
      data: { foo: 'bar' },
    };

    const newStorage = await migration40.migrate(
      oldStorage as unknown as MigrationInput,
    );
    expect(newStorage.data).toStrictEqual({
      foo: 'bar',
    });
  });
});
