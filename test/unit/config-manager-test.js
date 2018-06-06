// polyfill fetch
global.fetch = global.fetch || require('isomorphic-fetch')

const assert = require('assert')
const configManagerGen = require('../lib/mock-config-manager')

describe('config-manager', function () {
  var configManager

  beforeEach(function () {
    configManager = configManagerGen()
  })

  describe('#setConfig', function () {
    it('should set the config key', function () {
      var testConfig = {
        provider: {
          type: 'rpc',
          rpcTarget: 'foobar',
        },
      }
      configManager.setConfig(testConfig)
      var result = configManager.getData()

      assert.equal(result.config.provider.type, testConfig.provider.type)
      assert.equal(result.config.provider.rpcTarget, testConfig.provider.rpcTarget)
    })

    it('setting wallet should not overwrite config', function () {
      var testConfig = {
        provider: {
          type: 'rpc',
          rpcTarget: 'foobar',
        },
      }
      configManager.setConfig(testConfig)

      var testWallet = {
        name: 'this is my fake wallet',
      }
      configManager.setWallet(testWallet)

      var result = configManager.getData()
      assert.equal(result.wallet.name, testWallet.name, 'wallet name is set')
      assert.equal(result.config.provider.rpcTarget, testConfig.provider.rpcTarget)

      testConfig.provider.type = 'something else!'
      configManager.setConfig(testConfig)

      result = configManager.getData()
      assert.equal(result.wallet.name, testWallet.name, 'wallet name is set')
      assert.equal(result.config.provider.rpcTarget, testConfig.provider.rpcTarget)
      assert.equal(result.config.provider.type, testConfig.provider.type)
    })
  })

  describe('wallet nicknames', function () {
    it('should return null when no nicknames are saved', function () {
      var nick = configManager.nicknameForWallet('0x0')
      assert.equal(nick, null, 'no nickname returned')
    })

    it('should persist nicknames', function () {
      var account = '0x0'
      var nick1 = 'foo'
      var nick2 = 'bar'
      configManager.setNicknameForWallet(account, nick1)

      var result1 = configManager.nicknameForWallet(account)
      assert.equal(result1, nick1)

      configManager.setNicknameForWallet(account, nick2)
      var result2 = configManager.nicknameForWallet(account)
      assert.equal(result2, nick2)
    })
  })

  describe('rpc manipulations', function () {
    it('changing rpc should return a different rpc', function () {
      var firstRpc = 'first'
      var secondRpc = 'second'

      configManager.setRpcTarget(firstRpc)
      var firstResult = configManager.getCurrentRpcAddress()
      assert.equal(firstResult, firstRpc)

      configManager.setRpcTarget(secondRpc)
      var secondResult = configManager.getCurrentRpcAddress()
      assert.equal(secondResult, secondRpc)
    })
  })

  describe('transactions', function () {
    beforeEach(function () {
      configManager.setTxList([])
    })

    describe('#getTxList', function () {
      it('when new should return empty array', function () {
        var result = configManager.getTxList()
        assert.ok(Array.isArray(result))
        assert.equal(result.length, 0)
      })
    })

    describe('#setTxList', function () {
      it('saves the submitted data to the tx list', function () {
        var target = [{ foo: 'bar' }]
        configManager.setTxList(target)
        var result = configManager.getTxList()
        assert.equal(result[0].foo, 'bar')
      })
    })
  })

  describe('#setVault', function () {
    it('sets and gets vault data', function () {
      const testString = 'encrypted-string'
      configManager.setVault(testString)
      const data = configManager.getData()
      assert.equal(data.vault, testString)
    })
  })

  describe('#getKeychains', function () {
    it('sets and gets keychain', function () {
      const testString = 'keychain'
      configManager.setKeychains(testString)
      const keyChains = configManager.getKeychains()
      assert.equal(keyChains, 'keychain')
    })
  })

    describe('#setSelectedAccount', function () {
      it('sets and gets selected account', function () {
        const address = '0x023'
        configManager.setSelectedAccount(address)
        const selectedAddress = configManager.getSelectedAccount()
        assert.equal(selectedAddress, address)
      })
    })

    describe('#setShowSeedWords', function () {
      it('sets and gets shouldShowSeed', function () {
        configManager.setShowSeedWords(true)
        const boolShowSeed = configManager.getShouldShowSeedWords()
        assert.equal(boolShowSeed, true)
      })
    })

    describe('#setProviderType', function () {
      it('sets and gets provider type', function () {
        configManager.setProviderType('localhost')
        const providerType = configManager.getProvider()
        assert.equal(providerType.type, 'localhost')
      })
    })

    describe('#useEtherscanProvider', function () {
      it('sets provider to etherscan', function () {
        configManager.useEtherscanProvider()
        const providerType = configManager.getProvider()
        assert.equal(providerType.type, 'etherscan')
      })
    })

    describe('#getCurrentRpcAddress', function () {

      it('returns null when no provider is set', function () {
        assert.equal(configManager.getCurrentRpcAddress(), null)
      })

      it('returns infura mainnet url when provider is mainnet', function () {
        configManager.setProviderType('mainnet')
        assert.equal(configManager.getCurrentRpcAddress(), 'https://mainnet.infura.io')
      })

      it('returns infura ropsten url when provider is ropsten', function () {
        configManager.setProviderType('ropsten')
        assert.equal(configManager.getCurrentRpcAddress(), 'https://ropsten.infura.io')
      })

      it('returns infura kovan url when provider is kovan', function () {
        configManager.setProviderType('kovan')
        assert.equal(configManager.getCurrentRpcAddress(), 'https://kovan.infura.io')
      })

      it('returns infura rinkeby url when provider is rinkeby', function () {
        configManager.setProviderType('rinkeby')
        assert.equal(configManager.getCurrentRpcAddress(), 'https://rinkeby.infura.io')
      })

      it('defaults to rinkbey when provider type is called with empty args', function () {
        configManager.setProviderType()
        assert.equal(configManager.getCurrentRpcAddress(), 'https://rinkeby.infura.io')
      })
    })

    describe('#setSalt', function () {
      it('sets and gets salt', function () {
        const testSalt = 'OeolQodCv33b'
        configManager.setSalt(testSalt)
        assert.equal(configManager.getSalt(), testSalt)
      })
    })

    describe.only('#subscribe', function () {
      it('subscribes and unsubscribes', function () {

        configManager.subscribe(configManager.setData)
        assert.equal(typeof configManager._subs[0], 'function')

        configManager.unsubscribe(configManager.setData)
        assert.equal(configManager._subs.length, 0)
      })
    })

})
