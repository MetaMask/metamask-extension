import { strict as assert } from 'assert';
import wallet2 from '../../../test/lib/migrations/002.json';
import migration21 from './021';

describe('wallet2 is migrated successfully with out the BlacklistController', function () {
  it('should delete BlacklistController key', function (done) {
    migration21
      .migrate(wallet2)
      .then((migratedData) => {
        assert.equal(migratedData.meta.version, 21);
        assert(!migratedData.data.BlacklistController);
        assert(!migratedData.data.RecentBlocks);
        done();
      })
      .catch(done);
  });
});
