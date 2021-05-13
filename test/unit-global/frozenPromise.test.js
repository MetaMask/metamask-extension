// Should occur before anything else
import './globalPatch';
import 'ses/lockdown';
import '../../app/scripts/runLockdown';
import { strict as assert } from 'assert'; /* eslint-disable-line import/first,import/order */

describe('Promise global is immutable', function () {
  it('throws when reassinging promise (syntax 1)', function () {
    try {
      // eslint-disable-next-line no-global-assign,no-native-reassign
      Promise = {};
      assert.fail('did not throw error');
    } catch (err) {
      assert.ok(err, 'did throw error');
    }
  });

  it('throws when reassinging promise (syntax 2)', function () {
    try {
      global.Promise = {};
      assert.fail('did not throw error');
    } catch (err) {
      assert.ok(err, 'did throw error');
    }
  });

  it('throws when mutating existing Promise property', function () {
    try {
      Promise.all = () => undefined;
      assert.fail('did not throw error');
    } catch (err) {
      assert.ok(err, 'did throw error');
    }
  });

  it('throws when adding new Promise property', function () {
    try {
      Promise.foo = 'bar';
      assert.fail('did not throw error');
    } catch (err) {
      assert.ok(err, 'did throw error');
    }
  });

  it('throws when deleting Promise from global', function () {
    try {
      delete global.Promise;
      assert.fail('did not throw error');
    } catch (err) {
      assert.ok(err, 'did throw error');
    }
  });
});
