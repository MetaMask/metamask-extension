const assert = require('assert')
const extend = require('xtend')
const rp = require('request-promise')
const nock = require('nock')
var configManagerGen = require('../lib/mock-config-manager')
const STORAGE_KEY = 'metamask-persistance-key'

describe('config-manager', function() {
  var configManager

  beforeEach(function() {
    window.localStorage = {} // Hacking localStorage support into JSDom
    configManager = configManagerGen()
  })

  describe('currency conversions', function() {

    describe('#getCurrentFiat', function() {
      it('should return false if no previous key exists', function() {
        var result = configManager.getCurrentFiat()
        assert.ok(!result)
      })
    })

    describe('#setCurrentFiat', function() {
      it('should make getCurrentFiat return true once set', function() {
        assert.equal(configManager.getCurrentFiat(), false)
        configManager.setCurrentFiat('USD')
        var result = configManager.getCurrentFiat()
        assert.equal(result, 'USD')
      })

      it('should work with other currencies as well', function() {
        assert.equal(configManager.getCurrentFiat(), false)
        configManager.setCurrentFiat('JPY')
        var result = configManager.getCurrentFiat()
        assert.equal(result, 'JPY')
      })
    })

    describe('#getConversionRate', function() {
      it('should return false if non-existent', function() {
        var result = configManager.getConversionRate()
        assert.ok(!result)
      })
    })

    describe('#updateConversionRate', function() {
      it('should retrieve an update for ETH to USD and set it in memory', function(done) {
        this.timeout(15000)
        var usdMock = nock('https://www.cryptonator.com')
          .get('/api/ticker/eth-USD')
          .reply(200, '{"ticker":{"base":"ETH","target":"USD","price":"11.02456145","volume":"44948.91745289","change":"-0.01472534"},"timestamp":1472072136,"success":true,"error":""}')

        assert.equal(configManager.getConversionRate(), false)
        var promise = new Promise(
          function (resolve, reject) {
            configManager.setCurrentFiat('USD')
            configManager.updateConversionRate().then(function() {
              resolve()
            })
        })

        promise.then(function() {
          var result = configManager.getConversionRate()
          assert.equal(typeof result, 'number')
          done()
        }).catch(function(err) {
          console.log(err)
        })

      })

      it('should work for JPY as well.', function() {
        this.timeout(15000)
        assert.equal(configManager.getConversionRate(), false)

        var jpyMock = nock('https://www.cryptonator.com')
          .get('/api/ticker/eth-JPY')
          .reply(200, '{"ticker":{"base":"ETH","target":"JPY","price":"11.02456145","volume":"44948.91745289","change":"-0.01472534"},"timestamp":1472072136,"success":true,"error":""}')


        var promise = new Promise(
          function (resolve, reject) {
            configManager.setCurrentFiat('JPY')
            configManager.updateConversionRate().then(function() {
              resolve()
            })
        })

        promise.then(function() {
          var result = configManager.getConversionRate()
          assert.equal(typeof result, 'number')
        }).catch(function(err) {
          console.log(err)
        })
      })
    })
  })

  describe('confirmation', function() {

    describe('#getConfirmedDisclaimer', function() {
      it('should return false if no previous key exists', function() {
        var result = configManager.getConfirmedDisclaimer()
        assert.ok(!result)
      })
    })

    describe('#setConfirmedDisclaimer', function() {
      it('should make getConfirmedDisclaimer return true once set', function() {
        assert.equal(configManager.getConfirmedDisclaimer(), false)
        configManager.setConfirmedDisclaimer(true)
        var result = configManager.getConfirmedDisclaimer()
        assert.equal(result, true)
      })

      it('should be able to set false', function() {
        configManager.setConfirmedDisclaimer(false)
        var result = configManager.getConfirmedDisclaimer()
        assert.equal(result, false)
      })

      it('should persist to local storage', function() {
        configManager.setConfirmedDisclaimer(true)
        var data = configManager.getData()
        assert.equal(data.isDisclaimerConfirmed, true)
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
      configManager.setConfirmedDisclaimer(true)
      configManager.setConfig(testConfig)

      var testWallet = {
        name: 'this is my fake wallet'
      }
      configManager.setWallet(testWallet)

      var result = configManager.getData()
      assert.equal(result.wallet.name, testWallet.name, 'wallet name is set')
      assert.equal(result.config.provider.rpcTarget, testConfig.provider.rpcTarget)
      assert.equal(configManager.getConfirmedDisclaimer(), true)

      testConfig.provider.type = 'something else!'
      configManager.setConfig(testConfig)

      result = configManager.getData()
      assert.equal(result.wallet.name, testWallet.name, 'wallet name is set')
      assert.equal(result.config.provider.rpcTarget, testConfig.provider.rpcTarget)
      assert.equal(result.config.provider.type, testConfig.provider.type)
      assert.equal(configManager.getConfirmedDisclaimer(), true)
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

      it('cuts off early txs beyond a limit', function() {
        const limit = configManager.txLimit
        for (let i = 0; i < limit + 1; i++) {
          let tx = { id: i }
          configManager.addTx(tx)
        }
        var result = configManager.getTxList()
        assert.equal(result.length, limit, `limit of ${limit} txs enforced`)
        assert.equal(result[0].id, 1, 'early txs truncted')
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
