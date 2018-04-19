const assert = require('assert')
const PreferencesController = require('../../app/scripts/controllers/preferences')

describe('preferences controller', function () {
  let preferencesController

  beforeEach(() => {
    preferencesController = new PreferencesController()
  })

  describe('setAddresses', function () {
    it('should keep a map of addresses to names and addresses in the store', function () {
      preferencesController.setAddresses([
        '0xda22le',
        '0x7e57e2',
      ])

      const {identities} = preferencesController.store.getState()
      assert.deepEqual(identities, {
        '0xda22le': {
          name: 'Account 1',
          address: '0xda22le',
        },
        '0x7e57e2': {
          name: 'Account 2',
          address: '0x7e57e2',
        },
      })
    })

    it('should replace its list of addresses', function () {
      preferencesController.setAddresses([
        '0xda22le',
        '0x7e57e2',
      ])
      preferencesController.setAddresses([
        '0xda22le77',
        '0x7e57e277',
      ])

      const {identities} = preferencesController.store.getState()
      assert.deepEqual(identities, {
        '0xda22le77': {
          name: 'Account 1',
          address: '0xda22le77',
        },
        '0x7e57e277': {
          name: 'Account 2',
          address: '0x7e57e277',
        },
      })
    })
  })

  describe('getTokens', function () {
    it('should return an empty list initially', async function () {
      await preferencesController.setSelectedAddress('0x7e57e2')

      const tokens = preferencesController.getTokens()
      assert.equal(tokens.length, 0, 'empty list of tokens')
    })
  })

  describe('addToken', function () {
    it('should add that token to its state', async function () {
      const address = '0xabcdef1234567'
      const symbol = 'ABBR'
      const decimals = 5

      await preferencesController.setSelectedAddress('0x7e57e2')
      await preferencesController.addToken(address, symbol, decimals)

      const tokens = preferencesController.getTokens()
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

      await preferencesController.setSelectedAddress('0x7e57e2')
      await preferencesController.addToken(address, symbol, decimals)

      const newDecimals = 6
      await preferencesController.addToken(address, symbol, newDecimals)

      const tokens = preferencesController.getTokens()
      assert.equal(tokens.length, 1, 'one token added')

      const added = tokens[0]
      assert.equal(added.address, address, 'set address correctly')
      assert.equal(added.symbol, symbol, 'set symbol correctly')
      assert.equal(added.decimals, newDecimals, 'updated decimals correctly')
    })

    it('should allow adding tokens to two separate addresses', async function () {
      const address = '0xabcdef1234567'
      const symbol = 'ABBR'
      const decimals = 5

      await preferencesController.setSelectedAddress('0x7e57e2')
      await preferencesController.addToken(address, symbol, decimals)
      assert.equal(preferencesController.getTokens().length, 1, 'one token added for 1st address')

      await preferencesController.setSelectedAddress('0xda22le')
      await preferencesController.addToken(address, symbol, decimals)
      assert.equal(preferencesController.getTokens().length, 1, 'one token added for 2nd address')
    })
  })

  describe('removeToken', function () {
    it('should remove the only token from its state', async function () {
      await preferencesController.setSelectedAddress('0x7e57e2')
      await preferencesController.addToken('0xa', 'A', 5)
      await preferencesController.removeToken('0xa')

      const tokens = preferencesController.getTokens()
      assert.equal(tokens.length, 0, 'one token removed')
    })

    it('should remove a token from its state', async function () {
      await preferencesController.setSelectedAddress('0x7e57e2')
      await preferencesController.addToken('0xa', 'A', 4)
      await preferencesController.addToken('0xb', 'B', 5)
      await preferencesController.removeToken('0xa')

      const tokens = preferencesController.getTokens()
      assert.equal(tokens.length, 1, 'one token removed')

      const [token1] = tokens
      assert.deepEqual(token1, {address: '0xb', symbol: 'B', decimals: 5})
    })
  })
})

