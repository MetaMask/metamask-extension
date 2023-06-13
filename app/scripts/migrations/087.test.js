import { migrate, version } from './087';

describe('migration #87', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 86,
      },
      data: {},
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({
      version,
    });
  });

  it('should return state unaltered if there is no tokens controller state', async () => {
    const oldData = {
      other: 'data',
    };
    const oldStorage = {
      meta: {
        version: 86,
      },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('should return state unaltered if there is no tokens controller suggested assets state', async () => {
    const oldData = {
      other: 'data',
      TokensController: {
        allDetectedTokens: {},
        allIgnoredTokens: {},
        allTokens: {},
        detectedTokens: [],
        ignoredTokens: [],
        tokens: [],
      },
    };
    const oldStorage = {
      meta: {
        version: 86,
      },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('should remove the suggested assets state', async () => {
    const oldData = {
      other: 'data',
      TokensController: {
        allDetectedTokens: {},
        allIgnoredTokens: {},
        allTokens: {},
        detectedTokens: [],
        ignoredTokens: [],
        suggestedAssets: [],
        tokens: [],
      },
    };
    const oldStorage = {
      meta: {
        version: 86,
      },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      other: 'data',
      TokensController: {
        allDetectedTokens: {},
        allIgnoredTokens: {},
        allTokens: {},
        detectedTokens: [],
        ignoredTokens: [],
        tokens: [],
      },
    });
  });
});
