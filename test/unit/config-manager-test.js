const assert = require('assert')
const extend = require('xtend')
const STORAGE_KEY = 'metamask-persistance-key'
var configManagerGen = require('../lib/mock-config-manager')
var configManager
var testList
const rp = require('request-promise')
const nock = require('nock')

describe('config-manager', function() {

  beforeEach(function() {
    window.localStorage = {} // Hacking localStorage support into JSDom
    configManager = configManagerGen()
  })

  describe('notices', function() {
    describe('#getNoticesList', function() {
      it('should return an empty array when new', function() {
        var testList = [{
          id:0,
          read:false,
          title:"Futuristic Notice"
        }]
        var result = configManager.getNoticesList()
        assert.equal(result.length, 0)
      })
    })

    describe('#setNoticesList', function() {
      it('should set data appropriately', function () {
        var testList = [{
          id:0,
          read:false,
          title:"Futuristic Notice"
        }]
        configManager.setNoticesList(testList)
        var testListId = configManager.getNoticesList()[0].id
        assert.equal(testListId, 0)
      })
    })

    describe('#updateNoticeslist', function() {
      it('should integrate the latest changes from the source', function() {
        var testList = [{
          id:55,
          read:false,
          title:"Futuristic Notice"
        }]
        configManager.setNoticesList(testList)
        configManager.updateNoticesList().then(() => {
          var newList = configManager.getNoticesList()
          assert.ok(newList[0].id === 55)
          assert.ok(newList[1])
        })
      })
      it('should not overwrite any existing fields', function () {
        var testList = [{
          id:0,
          read:false,
          title:"Futuristic Notice"
        }]
        configManager.setNoticesList(testList)
        configManager.updateNoticesList().then(() => {
          var newList = configManager.getNoticesList()
          assert.equal(newList[0].id, 0)
          assert.equal(newList[0].title, "Futuristic Notice")
          assert.equal(newList.length, 1)
        })
      })
    })

    describe('#markNoticeRead', function () {
      it('should mark a notice as read', function () {
        var testList = [{
          id:0,
          read:false,
          title:"Futuristic Notice"
        }]
        configManager.setNoticesList(testList)
        configManager.markNoticeRead(testList[0])
        var newList = configManager.getNoticesList()
        assert.ok(newList[0].read)
      })
    })

    describe('#getLatestUnreadNotice', function () {
      it('should retrieve the latest unread notice', function () {
        var testList = [
          {id:0,read:true,title:"Past Notice"},
          {id:1,read:false,title:"Current Notice"},
          {id:2,read:false,title:"Future Notice"},
        ]
        configManager.setNoticesList(testList)
        var latestUnread = configManager.getLatestUnreadNotice()
        assert.equal(latestUnread.id, 2)
      })
      it('should return undefined if no unread notices exist.', function () {
        var testList = [
          {id:0,read:true,title:"Past Notice"},
          {id:1,read:true,title:"Current Notice"},
          {id:2,read:true,title:"Future Notice"},
        ]
        configManager.setNoticesList(testList)
        var latestUnread = configManager.getLatestUnreadNotice()
        assert.ok(!latestUnread)
      })
    })
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
