const { strict: assert } = require('assert');
const { FIXTURE_STATE_METADATA_VERSION } = require('./default-fixture');
const FixtureBuilder = require('./fixture-builder');

describe('FixtureBuilder', () => {
  describe('version checking', () => {
    it('should enforce fixture state version 74', () => {
      const builder = new FixtureBuilder();
      const fixture = builder.build();
      assert.equal(fixture.meta.version, FIXTURE_STATE_METADATA_VERSION);
    });

    it('should throw error if version mismatch', () => {
      const builder = new FixtureBuilder();
      builder.fixture.meta = { version: FIXTURE_STATE_METADATA_VERSION - 1 };

      assert.throws(
        () => {
          builder.build();
        },
        (err: Error) => {
          return err.message.includes('Fixture state version mismatch');
        },
      );
    });
  });
});
