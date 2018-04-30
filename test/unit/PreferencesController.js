const assert = require('assert')
const PreferencesController = require('../../app/scripts/controllers/ts/PreferencesController').default

describe('preferences controller', function () {
  let preferencesController

  before(() => {
    preferencesController = new PreferencesController({})
  })

  describe('addToken', function () {
    it('should add that token to its state', async function () {
      const address = '0xabcdef1234567'
      const symbol = 'ABBR'
      const decimals = 5

      await preferencesController.addToken(address, symbol, decimals)

      const tokens = preferencesController.state.tokens
      assert.equal(tokens.length, 1, 'one token added')

      const added = tokens[0]
      assert.equal(added.address, address, 'set address correctly')
      assert.equal(added.symbol, symbol, 'set symbol correctly')
      assert.equal(added.decimals, decimals, 'set decimals correctly')
    })

    it('should allow updating a token value', async function () {
      const address = '0xabcdef1234567'
      const symbol = 'ABBR'
      const decimals = 5

      await preferencesController.addToken(address, symbol, decimals)

      const newDecimals = 6
      await preferencesController.addToken(address, symbol, newDecimals)

      const tokens = preferencesController.state.tokens
      assert.equal(tokens.length, 1, 'one token added')

      const added = tokens[0]
      assert.equal(added.address, address, 'set address correctly')
      assert.equal(added.symbol, symbol, 'set symbol correctly')
      assert.equal(added.decimals, newDecimals, 'updated decimals correctly')
    })
  })
})

