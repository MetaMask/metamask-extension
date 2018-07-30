const assert = require('assert')
const ObservableStore = require('obs-store')
const PreferencesController = require('../../../../app/scripts/controllers/preferences')

describe('preferences controller', function () {
  let preferencesController
  let network

  beforeEach(() => {
    network = {providerStore: new ObservableStore({ type: 'mainnet' })}
    preferencesController = new PreferencesController({ network })
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

    it('should create account tokens for each account in the store', function () {
      preferencesController.setAddresses([
        '0xda22le',
        '0x7e57e2',
      ])

      const accountTokens = preferencesController.store.getState().accountTokens

      assert.deepEqual(accountTokens, {
        '0xda22le': {},
        '0x7e57e2': {},
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

  describe('removeAddress', function () {
    it('should remove an address from state', function () {
      preferencesController.setAddresses([
        '0xda22le',
        '0x7e57e2',
      ])

      preferencesController.removeAddress('0xda22le')

      assert.equal(preferencesController.store.getState().identities['0xda22le'], undefined)
    })

    it('should remove an address from state and respective tokens', function () {
      preferencesController.setAddresses([
        '0xda22le',
        '0x7e57e2',
      ])

      preferencesController.removeAddress('0xda22le')

      assert.equal(preferencesController.store.getState().accountTokens['0xda22le'], undefined)
    })

    it('should switch accounts if the selected address is removed', function () {
      preferencesController.setAddresses([
        '0xda22le',
        '0x7e57e2',
      ])

      preferencesController.setSelectedAddress('0x7e57e2')
      preferencesController.removeAddress('0x7e57e2')

      assert.equal(preferencesController.getSelectedAddress(), '0xda22le')
    })
  })

  describe('setAccountLabel', function () {
    it('should update a label for the given account', function () {
      preferencesController.setAddresses([
        '0xda22le',
        '0x7e57e2',
      ])

      assert.deepEqual(preferencesController.store.getState().identities['0xda22le'], {
        name: 'Account 1',
        address: '0xda22le',
      })


      preferencesController.setAccountLabel('0xda22le', 'Dazzle')
      assert.deepEqual(preferencesController.store.getState().identities['0xda22le'], {
        name: 'Dazzle',
        address: '0xda22le',
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

    it('should add token per account', async function () {
      const addressFirst = '0xabcdef1234567'
      const addressSecond = '0xabcdef1234568'
      const symbolFirst = 'ABBR'
      const symbolSecond = 'ABBB'
      const decimals = 5

      await preferencesController.setSelectedAddress('0x7e57e2')
      await preferencesController.addToken(addressFirst, symbolFirst, decimals)
      const tokensFirstAddress = preferencesController.getTokens()

      await preferencesController.setSelectedAddress('0xda22le')
      await preferencesController.addToken(addressSecond, symbolSecond, decimals)
      const tokensSeconAddress = preferencesController.getTokens()

      assert.notEqual(tokensFirstAddress, tokensSeconAddress, 'add different tokens for two account and tokens are equal')
    })

    it('should add token per network', async function () {
      const addressFirst = '0xabcdef1234567'
      const addressSecond = '0xabcdef1234568'
      const symbolFirst = 'ABBR'
      const symbolSecond = 'ABBB'
      const decimals = 5

      network.providerStore.updateState({ type: 'mainnet' })
      await preferencesController.addToken(addressFirst, symbolFirst, decimals)
      const tokensFirstAddress = preferencesController.getTokens()

      network.providerStore.updateState({ type: 'rinkeby' })
      await preferencesController.addToken(addressSecond, symbolSecond, decimals)
      const tokensSeconAddress = preferencesController.getTokens()

      assert.notEqual(tokensFirstAddress, tokensSeconAddress, 'add different tokens for two networks and tokens are equal')
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

    it('should remove a token from its state on corresponding address', async function () {
      await preferencesController.setSelectedAddress('0x7e57e2')
      await preferencesController.addToken('0xa', 'A', 4)
      await preferencesController.addToken('0xb', 'B', 5)
      await preferencesController.setSelectedAddress('0x7e57e3')
      await preferencesController.addToken('0xa', 'A', 4)
      await preferencesController.addToken('0xb', 'B', 5)
      const initialTokensSecond = preferencesController.getTokens()
      await preferencesController.setSelectedAddress('0x7e57e2')
      await preferencesController.removeToken('0xa')

      const tokensFirst = preferencesController.getTokens()
      assert.equal(tokensFirst.length, 1, 'one token removed in account')

      const [token1] = tokensFirst
      assert.deepEqual(token1, {address: '0xb', symbol: 'B', decimals: 5})

      await preferencesController.setSelectedAddress('0x7e57e3')
      const tokensSecond = preferencesController.getTokens()
      assert.deepEqual(tokensSecond, initialTokensSecond, 'token deleted for account')
    })

    it('should remove a token from its state on corresponding network', async function () {
      network.providerStore.updateState({ type: 'mainnet' })
      await preferencesController.addToken('0xa', 'A', 4)
      await preferencesController.addToken('0xb', 'B', 5)
      network.providerStore.updateState({ type: 'rinkeby' })
      await preferencesController.addToken('0xa', 'A', 4)
      await preferencesController.addToken('0xb', 'B', 5)
      const initialTokensSecond = preferencesController.getTokens()
      network.providerStore.updateState({ type: 'mainnet' })
      await preferencesController.removeToken('0xa')

      const tokensFirst = preferencesController.getTokens()
      assert.equal(tokensFirst.length, 1, 'one token removed in network')

      const [token1] = tokensFirst
      assert.deepEqual(token1, {address: '0xb', symbol: 'B', decimals: 5})

      network.providerStore.updateState({ type: 'rinkeby' })
      const tokensSecond = preferencesController.getTokens()
      assert.deepEqual(tokensSecond, initialTokensSecond, 'token deleted for network')
    })
  })

  describe('on setSelectedAddress', function () {
    it('should update tokens from its state on corresponding address', async function () {
      await preferencesController.setSelectedAddress('0x7e57e2')
      await preferencesController.addToken('0xa', 'A', 4)
      await preferencesController.addToken('0xb', 'B', 5)
      await preferencesController.setSelectedAddress('0x7e57e3')
      await preferencesController.addToken('0xa', 'C', 4)
      await preferencesController.addToken('0xb', 'D', 5)

      await preferencesController.setSelectedAddress('0x7e57e2')
      const initialTokensFirst = preferencesController.getTokens()
      await preferencesController.setSelectedAddress('0x7e57e3')
      const initialTokensSecond = preferencesController.getTokens()

      assert.notDeepEqual(initialTokensFirst, initialTokensSecond, 'tokens not equal for different accounts and tokens')

      await preferencesController.setSelectedAddress('0x7e57e2')
      const tokensFirst = preferencesController.getTokens()
      await preferencesController.setSelectedAddress('0x7e57e3')
      const tokensSecond = preferencesController.getTokens()

      assert.deepEqual(tokensFirst, initialTokensFirst, 'tokens equal for same account')
      assert.deepEqual(tokensSecond, initialTokensSecond, 'tokens equal for same account')
    })
  })

  describe('on updateStateNetworkType', function () {
    it('should remove a token from its state on corresponding network', async function () {
      network.providerStore.updateState({ type: 'mainnet' })
      await preferencesController.addToken('0xa', 'A', 4)
      await preferencesController.addToken('0xb', 'B', 5)
      const initialTokensFirst = preferencesController.getTokens()
      network.providerStore.updateState({ type: 'rinkeby' })
      await preferencesController.addToken('0xa', 'C', 4)
      await preferencesController.addToken('0xb', 'D', 5)
      const initialTokensSecond = preferencesController.getTokens()

      assert.notDeepEqual(initialTokensFirst, initialTokensSecond, 'tokens not equal for different networks and tokens')

      network.providerStore.updateState({ type: 'mainnet' })
      const tokensFirst = preferencesController.getTokens()
      network.providerStore.updateState({ type: 'rinkeby' })
      const tokensSecond = preferencesController.getTokens()
      assert.deepEqual(tokensFirst, initialTokensFirst, 'tokens equal for same network')
      assert.deepEqual(tokensSecond, initialTokensSecond, 'tokens equal for same network')
    })
  })
})

