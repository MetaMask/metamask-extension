import migration76 from './076';

describe('migration #76', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 75,
      },
      data: {},
    };

    const newStorage = await migration76.migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({
      version: 76,
    });
  });

  it('should migrate known controller state properties', async () => {
    const oldStorage = {
      meta: {
        version: 75,
      },
      data: {
        CollectiblesController: {
          allCollectibleContracts: 'foo',
          allCollectibles: 'bar',
          ignoredCollectibles: 'baz',
        },
        PreferencesController: {
          useCollectibleDetection: 'foobar',
        },
      },
    };

    const newStorage = await migration76.migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: 76,
      },
      data: {
        NftController: {
          allNftContracts: 'foo',
          allNfts: 'bar',
          ignoredNfts: 'baz',
        },
        PreferencesController: {
          useNftDetection: 'foobar',
        },
      },
    });
  });

  it('should migrate unknown controller state properties', async () => {
    const oldStorage = {
      meta: {
        version: 75,
      },
      data: {
        CollectiblesController: {
          allCollectibleContracts: 'foo',
          allCollectibles: 'bar',
          ignoredCollectibles: 'baz',
          extra: 'extra',
        },
        PreferencesController: {
          extra: 'extra',
          useCollectibleDetection: 'foobar',
        },
      },
    };

    const newStorage = await migration76.migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: 76,
      },
      data: {
        NftController: {
          allNftContracts: 'foo',
          allNfts: 'bar',
          ignoredNfts: 'baz',
          extra: 'extra',
        },
        PreferencesController: {
          extra: 'extra',
          useNftDetection: 'foobar',
        },
      },
    });
  });

  it('should handle missing controller state', async () => {
    const oldStorage = {
      meta: {
        version: 75,
      },
      data: {
        CollectiblesController: {
          extra: 'extra',
        },
        PreferencesController: {
          extra: 'extra',
        },
      },
    };

    const newStorage = await migration76.migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: 76,
      },
      data: {
        NftController: {
          extra: 'extra',
        },
        PreferencesController: {
          extra: 'extra',
        },
      },
    });
  });

  it('should handle missing CollectiblesController and PreferencesController', async () => {
    const oldStorage = {
      meta: {
        version: 75,
      },
      data: {
        FooController: { a: 'b' },
      },
    };

    const newStorage = await migration76.migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: 76,
      },
      data: {
        FooController: { a: 'b' },
      },
    });
  });
});
