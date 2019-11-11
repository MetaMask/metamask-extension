
/* eslint-disable no-native-reassign */

// this is what we're testing
require('../../app/scripts/lib/freezeGlobals')

const assert = require('assert')

describe('Promise global is immutable', () => {

  it('throws when reassinging promise (syntax 1)', () => {
    try {
      Promise = {}
      assert.fail('did not throw error')
    } catch (err) {
      assert.ok(err, 'did throw error')
    }
  })

  it('throws when reassinging promise (syntax 2)', () => {
    try {
      global.Promise = {}
      assert.fail('did not throw error')
    } catch (err) {
      assert.ok(err, 'did throw error')
    }
  })

  it('throws when mutating existing Promise property', () => {
    try {
      Promise.all = () => {}
      assert.fail('did not throw error')
    } catch (err) {
      assert.ok(err, 'did throw error')
    }
  })

  it('throws when adding new Promise property', () => {
    try {
      Promise.foo = 'bar'
      assert.fail('did not throw error')
    } catch (err) {
      assert.ok(err, 'did throw error')
    }
  })

  it('throws when deleting Promise from global', () => {
    try {
      delete global.Promise
      assert.fail('did not throw error')
    } catch (err) {
      assert.ok(err, 'did throw error')
    }
  })
})
