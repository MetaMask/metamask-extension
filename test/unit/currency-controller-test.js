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
      it('should retrieve an update for ETH to USD and set it in memory', async function () {
        nock('https://api.cryptonator.com')
          .get('/api/ticker/eth-USD')
          .reply(200, '{"ticker":{"base":"ETH","target":"USD","price":"11.02456145","volume":"44948.91745289","change":"-0.01472534"},"timestamp":1472072136,"success":true,"error":""}')

        assert.equal(currencyController.getConversionRate(), 0)
        currencyController.setCurrentCurrency('USD')
        await currencyController.updateConversionRate()
        var result = currencyController.getConversionRate()
        assert.equal(result, 11.02456145)
      })

      it('should work for JPY as well.', async function () {
        this.timeout(15000)
        assert.equal(currencyController.getConversionRate(), 0)

        nock('https://api.cryptonator.com')
          .get('/api/ticker/eth-JPY')
          .reply(200, '{"ticker":{"base":"ETH","target":"JPY","price":"11.02456145","volume":"44948.91745289","change":"-0.01472534"},"timestamp":1472072136,"success":true,"error":""}')

        currencyController.setCurrentCurrency('JPY')
        await currencyController.updateConversionRate()

        var result = currencyController.getConversionRate()
        assert.equal(result, 11.02456145)
      })
    })
  })
})
