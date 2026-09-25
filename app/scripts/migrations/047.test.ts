import migration47 from './047';

type MigrationInput = Parameters<typeof migration47.migrate>[0];

describe('migration #47', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 46,
      },
      data: {},
    };

    const newStorage = await migration47.migrate(
      oldStorage as unknown as MigrationInput,
    );
    expect(newStorage.meta).toStrictEqual({
      version: 47,
    });
  });

  it('should stringify transactions metamaskNetworkId values', async () => {
    const oldStorage = {
      meta: { version: 46 },
      data: {
        TransactionController: {
          transactions: [
            { foo: 'bar', metamaskNetworkId: 2 },
            { foo: 'bar' },
            { foo: 'bar', metamaskNetworkId: 0 },
            { foo: 'bar', metamaskNetworkId: 42 },
          ],
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration47.migrate(
      oldStorage as unknown as MigrationInput,
    );
    expect(newStorage.data).toStrictEqual({
      TransactionController: {
        transactions: [
          { foo: 'bar', metamaskNetworkId: '2' },
          { foo: 'bar' },
          { foo: 'bar', metamaskNetworkId: '0' },
          { foo: 'bar', metamaskNetworkId: '42' },
        ],
      },
      foo: 'bar',
    });
  });

  it('should do nothing if transactions metamaskNetworkId values are already strings', async () => {
    const oldStorage = {
      meta: { version: 46 },
      data: {
        TransactionController: {
          transactions: [
            { foo: 'bar', metamaskNetworkId: '2' },
            { foo: 'bar' },
            { foo: 'bar', metamaskNetworkId: '0' },
            { foo: 'bar', metamaskNetworkId: '42' },
          ],
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration47.migrate(
      oldStorage as unknown as MigrationInput,
    );
    expect(oldStorage.data).toStrictEqual(newStorage.data);
  });

  it('should do nothing if transactions state does not exist', async () => {
    const oldStorage = {
      meta: { version: 46 },
      data: {
        TransactionController: {
          bar: 'baz',
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration47.migrate(
      oldStorage as unknown as MigrationInput,
    );
    expect(oldStorage.data).toStrictEqual(newStorage.data);
  });

  it('should do nothing if transactions state is empty', async () => {
    const oldStorage = {
      meta: { version: 46 },
      data: {
        TransactionController: {
          transactions: [],
          bar: 'baz',
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration47.migrate(
      oldStorage as unknown as MigrationInput,
    );
    expect(oldStorage.data).toStrictEqual(newStorage.data);
  });

  it('should do nothing if state is empty', async () => {
    const oldStorage = {
      meta: { version: 46 },
      data: {},
    };

    const newStorage = await migration47.migrate(
      oldStorage as unknown as MigrationInput,
    );
    expect(oldStorage.data).toStrictEqual(newStorage.data);
  });
});
