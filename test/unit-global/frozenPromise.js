
'use strict'

// this is what we're testing
require('../../app/scripts/lib/freezePromise')

const test = require('tape')

test('Promise global is immutable', t => {

  try {
    /* eslint-disable-next-line */
    Promise = {}
    t.fail('did not throw error')
  } catch (err) {
    t.ok(err, 'throws when reassinging promise (syntax 1)')
  }

  try {
    /* eslint-disable-next-line */
    global.Promise = {}
    t.fail('did not throw error')
  } catch (err) {
    t.ok(err, 'throws when reassinging promise (syntax 2)')
  }

  try {
    /* eslint-disable-next-line */
    Promise.all = () => {}
    t.fail('did not throw error')
  } catch (err) {
    t.ok(err, 'throws when mutating existing Promise property')
  }

  try {
    /* eslint-disable-next-line */
    Promise.foo = 'bar'
    t.fail('did not throw error')
  } catch (err) {
    t.ok(err, 'throws when adding new Promise property')
  }

  t.end()
})
