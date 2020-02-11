import assert from 'assert'
import sinon from 'sinon'
import TokenRatesController from '../../../../app/scripts/controllers/token-rates'
import ObservableStore from 'obs-store'

describe('TokenRatesController', function () {
  it('should listen for preferences store updates', function () {
    const preferences = new ObservableStore({ tokens: [] })
    const controller = new TokenRatesController({ preferences })
    preferences.putState({ tokens: ['foo'] })
    assert.deepEqual(controller._tokens, ['foo'])
  })

  it('should poll on correct interval', async function () {
    const stub = sinon.stub(global, 'setInterval')
    new TokenRatesController({ interval: 1337 }) // eslint-disable-line no-new
    assert.strictEqual(stub.getCall(0).args[1], 1337)
    stub.restore()
  })
})
