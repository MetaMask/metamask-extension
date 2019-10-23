
'use strict'

/* eslint-disable no-native-reassign */

// this is what we're testing
require('../../app/scripts/lib/freezePromise')

const test = require('tape')

test('Promise global is immutable', t => {

  try {
    Promise = {}
    t.fail('did not throw error')
  } catch (err) {
    t.ok(err, 'throws when reassinging promise (syntax 1)')
  }

  try {
    global.Promise = {}
    t.fail('did not throw error')
  } catch (err) {
    t.ok(err, 'throws when reassinging promise (syntax 2)')
  }

  try {
    Promise.all = () => {}
    t.fail('did not throw error')
  } catch (err) {
    t.ok(err, 'throws when mutating existing Promise property')
  }

  try {
    Promise.foo = 'bar'
    t.fail('did not throw error')
  } catch (err) {
    t.ok(err, 'throws when adding new Promise property')
  }

  t.end()
})
