var assert = require('assert')
const extend = require('xtend')
const STORAGE_KEY = 'metamask-persistance-key'
var configManagerGen = require('../lib/mock-config-manager')
var configManager

describe('config-manager', function() {

  beforeEach(function() {
    window.localStorage = {} // Hacking localStorage support into JSDom
    configManager = configManagerGen()
  })

  describe('confirmation', function() {

    describe('#getConfirmed', function() {
      it('should return false if no previous key exists', function() {
        var result = configManager.getConfirmed()
        assert.ok(!result)
      })
    })

    describe('#setConfirmed', function() {
      it('should make getConfirmed return true once set', function() {
        assert.equal(configManager.getConfirmed(), false)
        configManager.setConfirmed(true)
        var result = configManager.getConfirmed()
        assert.equal(result, true)
      })

      it('should be able to set false', function() {
        configManager.setConfirmed(false)
        var result = configManager.getConfirmed()
        assert.equal(result, false)
      })

      it('should persist to local storage', function() {
        configManager.setConfirmed(true)
        var data = configManager.getData()
        assert.equal(data.isConfirmed, true)
      })
    })
  })

  describe('#setConfig', function() {
    window.localStorage = {} // Hacking localStorage support into JSDom

    it('should set the config key', function () {
      var testConfig = {
        provider: {
          type: 'rpc',
          rpcTarget: 'foobar'
        }
      }
      configManager.setConfig(testConfig)
      var result = configManager.getData()

      assert.equal(result.config.provider.type, testConfig.provider.type)
      assert.equal(result.config.provider.rpcTarget, testConfig.provider.rpcTarget)
    })

    it('setting wallet should not overwrite config', function() {
      var testConfig = {
        provider: {
          type: 'rpc',
          rpcTarget: 'foobar'
        },
      }
      configManager.setConfirmed(true)
      configManager.setConfig(testConfig)

      var testWallet = {
        name: 'this is my fake wallet'
      }
      configManager.setWallet(testWallet)

      var result = configManager.getData()
      assert.equal(result.wallet.name, testWallet.name, 'wallet name is set')
      assert.equal(result.config.provider.rpcTarget, testConfig.provider.rpcTarget)
      assert.equal(configManager.getConfirmed(), true)

      testConfig.provider.type = 'something else!'
      configManager.setConfig(testConfig)

      result = configManager.getData()
      assert.equal(result.wallet.name, testWallet.name, 'wallet name is set')
      assert.equal(result.config.provider.rpcTarget, testConfig.provider.rpcTarget)
      assert.equal(result.config.provider.type, testConfig.provider.type)
      assert.equal(configManager.getConfirmed(), true)
    })
  })

  describe('wallet nicknames', function() {
    it('should return null when no nicknames are saved', function() {
      var nick = configManager.nicknameForWallet('0x0')
      assert.equal(nick, null, 'no nickname returned')
    })

    it('should persist nicknames', function() {
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

  describe('rpc manipulations', function() {
    it('changing rpc should return a different rpc', function() {
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

  describe('transactions', function() {
    beforeEach(function() {
      configManager._saveTxList([])
    })

    describe('#getTxList', function() {
      it('when new should return empty array', function() {
        var result = configManager.getTxList()
        assert.ok(Array.isArray(result))
        assert.equal(result.length, 0)
      })
    })

    describe('#_saveTxList', function() {
      it('saves the submitted data to the tx list', function() {
        var target = [{ foo: 'bar' }]
        configManager._saveTxList(target)
        var result = configManager.getTxList()
        assert.equal(result[0].foo, 'bar')
      })
    })

    describe('#addTx', function() {
      it('adds a tx returned in getTxList', function() {
        var tx = { id: 1 }
        configManager.addTx(tx)
        var result = configManager.getTxList()
        assert.ok(Array.isArray(result))
        assert.equal(result.length, 1)
        assert.equal(result[0].id, 1)
      })
    })

    describe('#confirmTx', function() {
      it('sets the tx status to confirmed', function() {
        var tx = { id: 1, status: 'unconfirmed' }
        configManager.addTx(tx)
        configManager.confirmTx(1)
        var result = configManager.getTxList()
        assert.ok(Array.isArray(result))
        assert.equal(result.length, 1)
        assert.equal(result[0].status, 'confirmed')
      })
    })

    describe('#rejectTx', function() {
      it('sets the tx status to rejected', function() {
        var tx = { id: 1, status: 'unconfirmed' }
        configManager.addTx(tx)
        configManager.rejectTx(1)
        var result = configManager.getTxList()
        assert.ok(Array.isArray(result))
        assert.equal(result.length, 1)
        assert.equal(result[0].status, 'rejected')
      })
    })

    describe('#updateTx', function() {
      it('replaces the tx with the same id', function() {
        configManager.addTx({ id: '1', status: 'unconfirmed' })
        configManager.addTx({ id: '2', status: 'confirmed' })
        configManager.updateTx({ id: '1', status: 'blah', hash: 'foo' })
        var result = configManager.getTx('1')
        assert.equal(result.hash, 'foo')
      })
    })

    describe('#unconfirmedTxs', function() {
      it('returns unconfirmed txs in a hash', function() {
        configManager.addTx({ id: '1', status: 'unconfirmed' })
        configManager.addTx({ id: '2', status: 'confirmed' })
        let result = configManager.unconfirmedTxs()
        assert.equal(typeof result, 'object')
        assert.equal(result['1'].status, 'unconfirmed')
        assert.equal(result['0'], undefined)
        assert.equal(result['2'], undefined)
      })
    })

    describe('#getTx', function() {
      it('returns a tx with the requested id', function() {
        configManager.addTx({ id: '1', status: 'unconfirmed' })
        configManager.addTx({ id: '2', status: 'confirmed' })
        assert.equal(configManager.getTx('1').status, 'unconfirmed')
        assert.equal(configManager.getTx('2').status, 'confirmed')
      })
    })
  })
})

