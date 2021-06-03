import { strict as assert } from 'assert';
import firstTimeState from '../first-time-state';
import migration28 from './028';

const oldStorage = {
  meta: {},
  data: {
    PreferencesController: {
      tokens: [
        { address: '0xa', symbol: 'A', decimals: 4 },
        { address: '0xb', symbol: 'B', decimals: 4 },
      ],
      identities: {
        '0x6d14': {},
        '0x3695': {},
      },
    },
  },
};

describe('migration #28', function () {
  it('should add corresponding tokens to accountTokens', function (done) {
    migration28
      .migrate(oldStorage)
      .then((newStorage) => {
        const newTokens = newStorage.data.PreferencesController.tokens;
        const newAccountTokens =
          newStorage.data.PreferencesController.accountTokens;

        const testTokens = [
          { address: '0xa', symbol: 'A', decimals: 4 },
          { address: '0xb', symbol: 'B', decimals: 4 },
        ];
        assert.equal(
          newTokens.length,
          0,
          'tokens is expected to have the length of 0',
        );
        assert.equal(
          newAccountTokens['0x6d14'].mainnet.length,
          2,
          'tokens for address is expected to have the length of 2',
        );
        assert.equal(
          newAccountTokens['0x3695'].mainnet.length,
          2,
          'tokens for address is expected to have the length of 2',
        );
        assert.equal(
          Object.keys(newAccountTokens).length,
          2,
          'account tokens should be created for all identities',
        );
        assert.deepEqual(
          newAccountTokens['0x6d14'].mainnet,
          testTokens,
          'tokens for address should be the same than before',
        );
        assert.deepEqual(
          newAccountTokens['0x3695'].mainnet,
          testTokens,
          'tokens for address should be the same than before',
        );
        done();
      })
      .catch(done);
  });

  it('should successfully migrate first time state', function (done) {
    migration28
      .migrate({
        meta: {},
        data: firstTimeState,
      })
      .then((migratedData) => {
        assert.equal(migratedData.meta.version, migration28.version);
        done();
      })
      .catch(done);
  });
});
