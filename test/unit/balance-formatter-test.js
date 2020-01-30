const assert = require('assert')
const currencyFormatter = require('currency-formatter')
const infuraConversion = require('../../ui/app/helpers/constants/infura-conversion.json')

describe('currencyFormatting', function () {
  it('be able to format any infura currency', function (done) {
    const number = 10000

    infuraConversion.objects.forEach((conversion) => {
      const code = conversion.quote.code.toUpperCase()
      const result = currencyFormatter.format(number, { code })

      switch (code) {
        case 'USD':
          assert.equal(result, '$10,000.00')
          break
        case 'JPY':
          assert.equal(result, '¥10,000')
          break
        default:
          assert.ok(result, `Currency ${code} formatted as ${result}`)
      }
    })

    done()
  })
})
