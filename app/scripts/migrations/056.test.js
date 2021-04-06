import assert from 'assert';
import migration56 from './056';

const BAD_TOKEN_DATA = { symbol: null, decimals: null };
const TOKEN2 = { symbol: 'TXT', address: '0x11', decimals: 18 };
const TOKEN3 = { symbol: 'TVT', address: '0x12', decimals: 18 };

describe('migration #56', function () {
  it('should update the version metadata', async function () {
    const oldStorage = {
      meta: {
        version: 55,
      },
      data: {
        PreferencesController: {
          tokens: [],
          accountTokens: {},
          assetImages: {},
        },
      },
    };

    const newStorage = await migration56.migrate(oldStorage);
    assert.deepStrictEqual(newStorage.meta, {
      version: 56,
    });
  });

  it(`should filter out tokens without a valid address property`, async function () {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          tokens: [BAD_TOKEN_DATA, TOKEN2, BAD_TOKEN_DATA, TOKEN3],
          accountTokens: {},
          assetImages: {},
        },
      },
    };

    const newStorage = await migration56.migrate(oldStorage);
    assert.deepStrictEqual(newStorage.data.PreferencesController.tokens, [
      TOKEN2,
      TOKEN3,
    ]);
  });

  it(`should not filter any tokens when all token information is valid`, async function () {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          tokens: [TOKEN2, TOKEN3],
          accountTokens: {},
          assetImages: {},
        },
      },
    };

    const newStorage = await migration56.migrate(oldStorage);
    assert.deepStrictEqual(newStorage.data.PreferencesController.tokens, [
      TOKEN2,
      TOKEN3,
    ]);
  });

  it(`should filter out accountTokens without a valid address property`, async function () {
    const originalAccountTokens = {
      '0x1111111111111111111111111': {
        '0x1': [TOKEN2, TOKEN3, BAD_TOKEN_DATA],
        '0x3': [],
        '0x4': [BAD_TOKEN_DATA, BAD_TOKEN_DATA],
      },
      '0x1111111111111111111111112': {
        '0x1': [TOKEN2],
        '0x3': [],
        '0x4': [BAD_TOKEN_DATA, BAD_TOKEN_DATA],
      },
    };

    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          tokens: [],
          accountTokens: originalAccountTokens,
          assetImages: {},
        },
      },
    };

    const newStorage = await migration56.migrate(oldStorage);

    const desiredResult = { ...originalAccountTokens };
    // The last item in the array was bad and should be removed
    desiredResult['0x1111111111111111111111111']['0x1'].pop();
    // All items in 0x4 were bad
    desiredResult['0x1111111111111111111111111']['0x4'] = [];
    desiredResult['0x1111111111111111111111112']['0x4'] = [];

    assert.deepStrictEqual(
      newStorage.data.PreferencesController.accountTokens,
      desiredResult,
    );
  });

  it(`should remove a bad assetImages key`, async function () {
    const desiredAssetImages = {
      '0x514910771af9ca656af840dff83e8264ecf986ca':
        'images/contract/chainlink.svg',
    };
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          tokens: [],
          accountTokens: {},
          assetImages: { ...desiredAssetImages, undefined: null },
        },
      },
    };

    const newStorage = await migration56.migrate(oldStorage);
    assert.deepStrictEqual(
      newStorage.data.PreferencesController.assetImages,
      desiredAssetImages,
    );
  });

  it(`token data with no problems should preserve all data`, async function () {
    const perfectData = {
      tokens: [TOKEN2, TOKEN3],
      accountTokens: {
        '0x1111111111111111111111111': {
          '0x1': [],
          '0x3': [TOKEN2],
        },
        '0x1111111111111111111111112': {
          '0x1': [TOKEN2, TOKEN3],
          '0x3': [],
        },
      },
    };

    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: perfectData,
      },
    };

    const newStorage = await migration56.migrate(oldStorage);
    assert.deepStrictEqual(newStorage.data.PreferencesController, perfectData);
  });
});
