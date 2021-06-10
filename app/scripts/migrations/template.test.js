import { strict as assert } from 'assert';
import migrationTemplate from './template';

const storage = {
  meta: {},
  data: {},
};

describe('storage is migrated successfully', function () {
  it('should work', function (done) {
    migrationTemplate
      .migrate(storage)
      .then((migratedData) => {
        assert.equal(migratedData.meta.version, 0);
        done();
      })
      .catch(done);
  });
});
