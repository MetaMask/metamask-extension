const assert = require('assert')
const sinon = require('sinon')
const DetectTokensController = require('../../../../app/scripts/controllers/detect-tokens')
const PreferencesController = require('../../../../app/scripts/controllers/preferences')
const ObservableStore = require('obs-store')

describe('DetectTokensController', () => {
  it('should poll on correct interval', async () => {
    const stub = sinon.stub(global, 'setInterval')
    new DetectTokensController({ interval: 1337 }) // eslint-disable-line no-new
    assert.strictEqual(stub.getCall(0).args[1], 1337)
    stub.restore()
  })

  it('should not check tokens while in test network', async () => {
    var network = new ObservableStore({provider: {type:'rinkeby'}})
    const preferences = new PreferencesController()
    const controller = new DetectTokensController({preferences: preferences, network: network})
    controller.isActive = true
    controller.contracts = {
        "0x0D262e5dC4A06a0F1c90cE79C7a60C09DfC884E4": {
            "name": "JET8 Token",
            "logo": "J8T.svg",
            "erc20": true,
            "symbol": "J8T",
            "decimals": 8
        },
        "0xBC86727E770de68B1060C91f6BB6945c73e10388": {
            "name": "Ink Protocol",
            "logo": "ink_protocol.svg",
            "erc20": true,
            "symbol": "XNK",
            "decimals": 18
        }
      }
    controller.fetchContractAccountBalance = address => address

    await controller.exploreNewTokens()
    assert.deepEqual(preferences.store.getState().tokens, [])
    
  })

  it('should only check and add tokens while in main network', async () => {
    const network = new ObservableStore({provider: {type:'mainnet'}})
    const preferences = new PreferencesController()
    const controller = new DetectTokensController({preferences: preferences, network: network})
    controller.isActive = true
    controller.contracts = {
        "0x0D262e5dC4A06a0F1c90cE79C7a60C09DfC884E4": {
            "name": "JET8 Token",
            "logo": "J8T.svg",
            "erc20": true,
            "symbol": "J8T",
            "decimals": 8
        },
        "0xBC86727E770de68B1060C91f6BB6945c73e10388": {
            "name": "Ink Protocol",
            "logo": "ink_protocol.svg",
            "erc20": true,
            "symbol": "XNK",
            "decimals": 18
        }
    }
    controller.fetchContractAccountBalance = address => address
  
    await controller.exploreNewTokens()
    assert.deepEqual(preferences.store.getState().tokens, 
      [{address: "0x0d262e5dc4a06a0f1c90ce79c7a60c09dfc884e4", decimals: 8, symbol: "J8T"}, 
      {address: "0xbc86727e770de68b1060c91f6bb6945c73e10388", decimals: 18, symbol: "XNK"}])
  })

  it('should not detect same token while in main network', async () => {
    const network = new ObservableStore({provider: {type:'mainnet'}})
    const preferences = new PreferencesController()
    preferences.addToken("0x0d262e5dc4a06a0f1c90ce79c7a60c09dfc884e4", 8, "J8T")
    const controller = new DetectTokensController({preferences: preferences, network: network})
    controller.isActive = true
    controller.contracts = {
        "0x0D262e5dC4A06a0F1c90cE79C7a60C09DfC884E4": {
            "name": "JET8 Token",
            "logo": "J8T.svg",
            "erc20": true,
            "symbol": "J8T",
            "decimals": 8
        },
        "0xBC86727E770de68B1060C91f6BB6945c73e10388": {
            "name": "Ink Protocol",
            "logo": "ink_protocol.svg",
            "erc20": true,
            "symbol": "XNK",
            "decimals": 18
        }
    }
    controller.fetchContractAccountBalance = address => address
  
    await controller.exploreNewTokens()
    assert.deepEqual(preferences.store.getState().tokens, 
      [{address: "0x0d262e5dc4a06a0f1c90ce79c7a60c09dfc884e4", decimals: 8, symbol: "J8T"}, 
      {address: "0xbc86727e770de68b1060c91f6bb6945c73e10388", decimals: 18, symbol: "XNK"}])
  })
})
