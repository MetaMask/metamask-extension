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
        assert.equal(currencyController.getCurrentCurrency(), 'usd')
      })

      it('should be able to set to other currency', function () {
        assert.equal(currencyController.getCurrentCurrency(), 'usd')
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
        nock('https://api.infura.io')
          .get('/v1/ticker/ethusd')
          .reply(200, '{"base": "ETH", "quote": "USD", "bid": 288.45, "ask": 288.46, "volume": 112888.17569277, "exchange": "bitfinex", "total_volume": 272175.00106721005, "num_exchanges": 8, "timestamp": 1506444677}')

        assert.equal(currencyController.getConversionRate(), 0)
        currencyController.setCurrentCurrency('usd')
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

        nock('https://api.infura.io')
          .get('/v1/ticker/ethjpy')
          .reply(200, '{"base": "ETH", "quote": "JPY", "bid": 32300.0, "ask": 32400.0, "volume": 247.4616071, "exchange": "kraken", "total_volume": 247.4616071, "num_exchanges": 1, "timestamp": 1506444676}')


        var promise = new Promise(
          function (resolve, reject) {
            currencyController.setCurrentCurrency('jpy')
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
