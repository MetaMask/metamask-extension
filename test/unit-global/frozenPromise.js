
/* eslint-disable no-native-reassign */

// this is what we're testing
import '../../app/scripts/lib/freezeGlobals'

import assert from 'assert'

describe('Promise global is immutable', function () {

  it('throws when reassinging promise (syntax 1)', function () {
    try {
      Promise = {}
      assert.fail('did not throw error')
    } catch (err) {
      assert.ok(err, 'did throw error')
    }
  })

  it('throws when reassinging promise (syntax 2)', function () {
    try {
      global.Promise = {}
      assert.fail('did not throw error')
    } catch (err) {
      assert.ok(err, 'did throw error')
    }
  })

  it('throws when mutating existing Promise property', function () {
    try {
      Promise.all = () => {}
      assert.fail('did not throw error')
    } catch (err) {
      assert.ok(err, 'did throw error')
    }
  })

  it('throws when adding new Promise property', function () {
    try {
      Promise.foo = 'bar'
      assert.fail('did not throw error')
    } catch (err) {
      assert.ok(err, 'did throw error')
    }
  })

  it('throws when deleting Promise from global', function () {
    try {
      delete global.Promise
      assert.fail('did not throw error')
    } catch (err) {
      assert.ok(err, 'did throw error')
    }
  })
})
