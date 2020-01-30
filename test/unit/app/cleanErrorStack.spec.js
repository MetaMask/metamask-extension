const assert = require('assert')
const cleanErrorStack = require('../../../app/scripts/lib/cleanErrorStack')

describe('Clean Error Stack', () => {

  const testMessage = 'Test Message'
  const testError = new Error(testMessage)
  const undefinedErrorName = new Error(testMessage)
  const blankErrorName = new Error(testMessage)
  const blankMsgError = new Error()

  beforeEach(() => {
    undefinedErrorName.name = undefined
    blankErrorName.name = ''
  })

  it('tests error with message', () => {
    assert.equal(cleanErrorStack(testError), 'Error: Test Message')
  })

  it('tests error with undefined name', () => {
    assert.equal(cleanErrorStack(undefinedErrorName).toString(), 'Error: Test Message')
  })

  it('tests error with blank name', () => {
    assert.equal(cleanErrorStack(blankErrorName).toString(), 'Test Message')
  })

  it('tests error with blank message', () => {
    assert.equal(cleanErrorStack(blankMsgError), 'Error')
  })

})
