// polyfill fetch
global.fetch = global.fetch || require('isomorphic-fetch')

const assert = require('assert')
const nock = require('nock')
const CurrencyController = require('../../app/scripts/controllers/currency')

describe('currency-controller', function () {
  var currencyController

  beforeEach(function () {
    currencyController = new CurrencyController()
  })

  describe('currency conversions', function () {
    describe('#setCurrentCurrency', function () {
      it('should return USD as default', function () {
        assert.equal(currencyController.getCurrentCurrency(), 'USD')
      })

      it('should be able to set to other currency', function () {
        assert.equal(currencyController.getCurrentCurrency(), 'USD')
        currencyController.setCurrentCurrency('JPY')
        var result = currencyController.getCurrentCurrency()
        assert.equal(result, 'JPY')
      })
    })

    describe('#getConversionRate', function () {
      it('should return undefined if non-existent', function () {
        var result = currencyController.getConversionRate()
        assert.ok(!result)
      })
    })

    describe('#updateConversionRate', function () {
      it('should retrieve an update for ETH to USD and set it in memory', function (done) {
        this.timeout(15000)
        nock('https://www.cryptonator.com')
          .get('/api/ticker/eth-USD')
          .reply(200, '{"ticker":{"base":"ETH","target":"USD","price":"11.02456145","volume":"44948.91745289","change":"-0.01472534"},"timestamp":1472072136,"success":true,"error":""}')

        assert.equal(currencyController.getConversionRate(), 0)
        currencyController.setCurrentCurrency('USD')
        currencyController.updateConversionRate()
        .then(function () {
          var result = currencyController.getConversionRate()
          console.log('currencyController.getConversionRate:', result)
          assert.equal(typeof result, 'number')
          done()
        }).catch(function (err) {
          done(err)
        })
      })

      it('should work for JPY as well.', function () {
        this.timeout(15000)
        assert.equal(currencyController.getConversionRate(), 0)

        nock('https://www.cryptonator.com')
          .get('/api/ticker/eth-JPY')
          .reply(200, '{"ticker":{"base":"ETH","target":"JPY","price":"11.02456145","volume":"44948.91745289","change":"-0.01472534"},"timestamp":1472072136,"success":true,"error":""}')


        var promise = new Promise(
          function (resolve, reject) {
            currencyController.setCurrentCurrency('JPY')
            currencyController.updateConversionRate().then(function () {
              resolve()
            })
          })

        promise.then(function () {
          var result = currencyController.getConversionRate()
          assert.equal(typeof result, 'number')
        }).catch(function (done, err) {
          done(err)
        })
      })
    })
  })
})
