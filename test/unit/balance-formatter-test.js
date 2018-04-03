const assert = require('assert')
const currencyFormatter = require('currency-formatter')
const infuraConversion = require('../../ui/app/infura-conversion.json')

describe.only('currencyFormatting', function () {
  it('be able to format any infura currency', function (done) {
    const number = 10000

    infuraConversion.objects.forEach((conversion) => {
      const code = conversion.quote.code.toUpperCase()
      const result = currencyFormatter.format(number, { code })
      assert.ok(result, `Currency ${code} formatted as ${result}`)
    })

    done()
  })
})
