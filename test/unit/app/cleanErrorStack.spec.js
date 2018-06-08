const assert = require('assert')
const cleanErrorStack = require('../../../app/scripts/lib/cleanErrorStack')

describe('Clean Error Stack', function () {

  const testError = new Error('test error')

  it('returns just the error with ', function () {
    assert.equal(cleanErrorStack(testError), 'Error: test error')
  })
})
