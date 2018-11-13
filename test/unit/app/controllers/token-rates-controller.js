const assert = require('assert')
const sinon = require('sinon')
const TokenRatesController = require('../../../../app/scripts/controllers/token-rates')
const ObservableStore = require('obs-store')

describe('TokenRatesController', () => {
  it('should listen for preferences store updates', () => {
    const preferences = new ObservableStore({ tokens: [] })
    const controller = new TokenRatesController({ preferences })
    preferences.putState({ tokens: ['foo'] })
    assert.deepEqual(controller._tokens, ['foo'])
  })

  it('should poll on correct interval', async () => {
    const stub = sinon.stub(global, 'setInterval')
    new TokenRatesController({ interval: 1337 }) // eslint-disable-line no-new
    assert.strictEqual(stub.getCall(0).args[1], 1337)
    stub.restore()
  })
})
