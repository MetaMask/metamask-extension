const assert = require('assert')
const sinon = require('sinon')
const DetectTokensController = require('../../../../app/scripts/controllers/detect-tokens')
const NetworkController = require('../../../../app/scripts/controllers/network/network')
const PreferencesController = require('../../../../app/scripts/controllers/preferences')

describe('DetectTokensController', () => {
    const sandbox = sinon.createSandbox()   
    let clock
    before(async () => {
    }) 
      after(() => {
        sandbox.restore()
  })

  it('should poll on correct interval', async () => {
    const stub = sinon.stub(global, 'setInterval')
    new DetectTokensController({ interval: 1337 }) // eslint-disable-line no-new
    assert.strictEqual(stub.getCall(0).args[1], 1337)
    stub.restore()
  })

  it('should be called on every polling period', async () => {
    clock = sandbox.useFakeTimers()
    const network = new NetworkController()
    network.setProviderType('mainnet')
    const preferences = new PreferencesController()
    const controller = new DetectTokensController({preferences: preferences, network: network})
    controller.isActive = true

    var stub = sandbox.stub(controller, 'exploreNewTokens')

    clock.tick(1)
    sandbox.assert.notCalled(stub)
    clock.tick(180000)
    sandbox.assert.called(stub)
    clock.tick(180000)
    sandbox.assert.calledTwice(stub)
    clock.tick(180000)
    sandbox.assert.calledThrice(stub)
  })

  it('should not check tokens while in test network', async () => {
    const network = new NetworkController()
    network.setProviderType('rinkeby')
    const preferences = new PreferencesController()
    const controller = new DetectTokensController({preferences: preferences, network: network})
    controller.isActive = true

    var stub = sandbox.stub(controller, 'detectTokenBalance')
        .withArgs('0x0D262e5dC4A06a0F1c90cE79C7a60C09DfC884E4').returns(true)
        .withArgs('0xBC86727E770de68B1060C91f6BB6945c73e10388').returns(true)

    await controller.exploreNewTokens()
    sandbox.assert.notCalled(stub)
  })

  it('should only check and add tokens while in main network', async () => {
    const network = new NetworkController()
    network.setProviderType('mainnet')
    const preferences = new PreferencesController()
    const controller = new DetectTokensController({preferences: preferences, network: network})
    controller.isActive = true

    sandbox.stub(controller, 'detectTokenBalance')
        .withArgs('0x0D262e5dC4A06a0F1c90cE79C7a60C09DfC884E4')
        .returns(preferences.addToken('0x0d262e5dc4a06a0f1c90ce79c7a60c09dfc884e4', 'J8T', 8))
        .withArgs('0xBC86727E770de68B1060C91f6BB6945c73e10388')
        .returns(preferences.addToken('0xbc86727e770de68b1060c91f6bb6945c73e10388', 'XNK', 18))

    await controller.exploreNewTokens()
    assert.deepEqual(preferences.store.getState().tokens, [{address: '0x0d262e5dc4a06a0f1c90ce79c7a60c09dfc884e4', decimals: 8, symbol: 'J8T'},
        {address: '0xbc86727e770de68b1060c91f6bb6945c73e10388', decimals: 18, symbol: 'XNK'}])
  })

  it('should not detect same token while in main network', async () => {
    const network = new NetworkController()
    network.setProviderType('mainnet')
    const preferences = new PreferencesController()
    preferences.addToken('0x0d262e5dc4a06a0f1c90ce79c7a60c09dfc884e4', 'J8T', 8)
    const controller = new DetectTokensController({preferences: preferences, network: network})
    controller.isActive = true

    sandbox.stub(controller, 'detectTokenBalance')
      .withArgs('0x0D262e5dC4A06a0F1c90cE79C7a60C09DfC884E4')
      .returns(preferences.addToken('0x0d262e5dc4a06a0f1c90ce79c7a60c09dfc884e4', 'J8T', 8))
      .withArgs('0xBC86727E770de68B1060C91f6BB6945c73e10388')
      .returns(preferences.addToken('0xbc86727e770de68b1060c91f6bb6945c73e10388', 'XNK', 18))

    await controller.exploreNewTokens()
    assert.deepEqual(preferences.store.getState().tokens, [{address: '0x0d262e5dc4a06a0f1c90ce79c7a60c09dfc884e4', decimals: 8, symbol: 'J8T'},
        {address: '0xbc86727e770de68b1060c91f6bb6945c73e10388', decimals: 18, symbol: 'XNK'}])
  })
})
