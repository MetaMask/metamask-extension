const assert = require('assert')
const sinon = require('sinon')
const TokenRatesController = require('../../app/scripts/controllers/ts/TokenRatesController').default
const PreferencesController = require('../../app/scripts/controllers/ts/PreferencesController').default

describe('TokenRatesController', () => {
  it('should listen for preferences store updates', () => {
    const preferencesController = new PreferencesController({})
    const controller = new TokenRatesController({ preferencesController })
    controller.fetchExchangeRate = sinon.stub()
    preferencesController.updateState({ tokens: [{ address: 'foo' }] })
    assert(controller.fetchExchangeRate.called)
    assert.strictEqual(controller.fetchExchangeRate.getCall(0).args[0], 'foo')
  })

  it('should poll on correct interval', async () => {
    const stub = sinon.stub(global, 'setInterval')
    const preferencesController = new PreferencesController({})
    new TokenRatesController({ interval: 1337, preferencesController }) // eslint-disable-line no-new
    assert.strictEqual(stub.getCall(0).args[1], 1337)
    stub.restore()
  })

  it('should fetch each token rate based on address', async () => {
    const preferencesController = new PreferencesController({})
    const controller = new TokenRatesController({ preferencesController })
    controller.fetchExchangeRate = address => address
    controller.tokens = [{ address: 'foo' }, { address: 'bar' }]
    await controller.updateExchangeRates()
    assert.deepEqual(controller.state.contractExchangeRates, { foo: 'foo', bar: 'bar' })
  })
})
