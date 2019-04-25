const assert = require('assert')
const ObservableStore = require('obs-store')
const PreferencesController = require('../../../../app/scripts/controllers/preferences')
const sinon = require('sinon')

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

  describe('on watchAsset', function () {
    var stubNext, stubEnd, stubHandleWatchAssetERC20, asy, req, res
    const sandbox = sinon.createSandbox()

    beforeEach(() => {
      req = {params: {}}
      res = {}
      asy = {next: () => {}, end: () => {}}
      stubNext = sandbox.stub(asy, 'next')
      stubEnd = sandbox.stub(asy, 'end').returns(0)
      stubHandleWatchAssetERC20 = sandbox.stub(preferencesController, '_handleWatchAssetERC20')
    })
    after(() => {
      sandbox.restore()
    })

    it('shouldn not do anything if method not corresponds', async function () {
      const asy = {next: () => {}, end: () => {}}
      var stubNext = sandbox.stub(asy, 'next')
      var stubEnd = sandbox.stub(asy, 'end').returns(0)
      req.method = 'metamask'
      await preferencesController.requestWatchAsset(req, res, asy.next, asy.end)
      sandbox.assert.notCalled(stubEnd)
      sandbox.assert.called(stubNext)
    })
    it('should do something if method is supported', async function () {
      const asy = {next: () => {}, end: () => {}}
      var stubNext = sandbox.stub(asy, 'next')
      var stubEnd = sandbox.stub(asy, 'end').returns(0)
      req.method = 'metamask_watchAsset'
      req.params.type = 'someasset'
      await preferencesController.requestWatchAsset(req, res, asy.next, asy.end)
      sandbox.assert.called(stubEnd)
      sandbox.assert.notCalled(stubNext)
      req.method = 'wallet_watchAsset'
      req.params.type = 'someasset'
      await preferencesController.requestWatchAsset(req, res, asy.next, asy.end)
      sandbox.assert.calledTwice(stubEnd)
      sandbox.assert.notCalled(stubNext)
    })
    it('should through error if method is supported but asset type is not', async function () {
      req.method = 'metamask_watchAsset'
      req.params.type = 'someasset'
      await preferencesController.requestWatchAsset(req, res, asy.next, asy.end)
      sandbox.assert.called(stubEnd)
      sandbox.assert.notCalled(stubHandleWatchAssetERC20)
      sandbox.assert.notCalled(stubNext)
      assert.deepEqual(res, {})
    })
    it('should trigger handle add asset if type supported', async function () {
      const asy = {next: () => {}, end: () => {}}
      req.method = 'metamask_watchAsset'
      req.params.type = 'ERC20'
      await preferencesController.requestWatchAsset(req, res, asy.next, asy.end)
      sandbox.assert.called(stubHandleWatchAssetERC20)
    })
  })

  describe('on watchAsset of type ERC20', function () {
    var req

    const sandbox = sinon.createSandbox()
    beforeEach(() => {
      req = {params: {type: 'ERC20'}}
    })
    after(() => {
      sandbox.restore()
    })

    it('should add suggested token', async function () {
      const address = '0xabcdef1234567'
      const symbol = 'ABBR'
      const decimals = 5
      const image = 'someimage'
      req.params.options = { address, symbol, decimals, image }

      sandbox.stub(preferencesController, '_validateERC20AssetParams').returns(true)
      preferencesController.openPopup = async () => {}

      await preferencesController._handleWatchAssetERC20(req.params.options)
      const suggested = preferencesController.getSuggestedTokens()
      assert.equal(Object.keys(suggested).length, 1, `one token added ${Object.keys(suggested)}`)

      assert.equal(suggested[address].address, address, 'set address correctly')
      assert.equal(suggested[address].symbol, symbol, 'set symbol correctly')
      assert.equal(suggested[address].decimals, decimals, 'set decimals correctly')
      assert.equal(suggested[address].image, image, 'set image correctly')
    })

    it('should add token correctly if user confirms', async function () {
      const address = '0xabcdef1234567'
      const symbol = 'ABBR'
      const decimals = 5
      const image = 'someimage'
      req.params.options = { address, symbol, decimals, image }

      sandbox.stub(preferencesController, '_validateERC20AssetParams').returns(true)
      preferencesController.openPopup = async () => {
        await preferencesController.addToken(address, symbol, decimals, image)
      }

      await preferencesController._handleWatchAssetERC20(req.params.options)
      const tokens = preferencesController.getTokens()
      assert.equal(tokens.length, 1, `one token added`)
      const added = tokens[0]
      assert.equal(added.address, address, 'set address correctly')
      assert.equal(added.symbol, symbol, 'set symbol correctly')
      assert.equal(added.decimals, decimals, 'set decimals correctly')

      const assetImages = preferencesController.getAssetImages()
      assert.ok(assetImages[address], `set image correctly`)
    })
    it('should validate ERC20 asset correctly', async function () {
      const validateSpy = sandbox.spy(preferencesController._validateERC20AssetParams)
      try { validateSpy({rawAddress: '0xd26114cd6EE289AccF82350c8d8487fedB8A0C07', symbol: 'ABC', decimals: 0}) } catch (e) {}
      assert.equal(validateSpy.threw(), false, 'correct options object')
      const validateSpyAddress = sandbox.spy(preferencesController._validateERC20AssetParams)
      try { validateSpyAddress({symbol: 'ABC', decimals: 0}) } catch (e) {}
      assert.equal(validateSpyAddress.threw(), true, 'options object with no address')
      const validateSpySymbol = sandbox.spy(preferencesController._validateERC20AssetParams)
      try { validateSpySymbol({rawAddress: '0xd26114cd6EE289AccF82350c8d8487fedB8A0C07', decimals: 0}) } catch (e) {}
      assert.equal(validateSpySymbol.threw(), true, 'options object with no symbol')
      const validateSpyDecimals = sandbox.spy(preferencesController._validateERC20AssetParams)
      try { validateSpyDecimals({rawAddress: '0xd26114cd6EE289AccF82350c8d8487fedB8A0C07', symbol: 'ABC'}) } catch (e) {}
      assert.equal(validateSpyDecimals.threw(), true, 'options object with no decimals')
      const validateSpyInvalidSymbol = sandbox.spy(preferencesController._validateERC20AssetParams)
      try { validateSpyInvalidSymbol({rawAddress: '0xd26114cd6EE289AccF82350c8d8487fedB8A0C07', symbol: 'ABCDEFGHI', decimals: 0}) } catch (e) {}
      assert.equal(validateSpyInvalidSymbol.threw(), true, 'options object with invalid symbol')
      const validateSpyInvalidDecimals1 = sandbox.spy(preferencesController._validateERC20AssetParams)
      try { validateSpyInvalidDecimals1({rawAddress: '0xd26114cd6EE289AccF82350c8d8487fedB8A0C07', symbol: 'ABCDEFGHI', decimals: -1}) } catch (e) {}
      assert.equal(validateSpyInvalidDecimals1.threw(), true, 'options object with decimals less than zero')
      const validateSpyInvalidDecimals2 = sandbox.spy(preferencesController._validateERC20AssetParams)
      try { validateSpyInvalidDecimals2({rawAddress: '0xd26114cd6EE289AccF82350c8d8487fedB8A0C07', symbol: 'ABCDEFGHI', decimals: 38}) } catch (e) {}
      assert.equal(validateSpyInvalidDecimals2.threw(), true, 'options object with decimals more than 36')
      const validateSpyInvalidAddress = sandbox.spy(preferencesController._validateERC20AssetParams)
      try { validateSpyInvalidAddress({rawAddress: '0x123', symbol: 'ABC', decimals: 0}) } catch (e) {}
      assert.equal(validateSpyInvalidAddress.threw(), true, 'options object with address invalid')
    })
  })

  describe('setPasswordForgotten', function () {
    it('should default to false', function () {
      const state = preferencesController.store.getState()
      assert.equal(state.forgottenPassword, false)
    })

    it('should set the forgottenPassword property in state', function () {
      assert.equal(preferencesController.store.getState().forgottenPassword, false)

      preferencesController.setPasswordForgotten(true)

      assert.equal(preferencesController.store.getState().forgottenPassword, true)
    })
  })

  describe('setSeedWords', function () {
    it('should default to null', function () {
      const state = preferencesController.store.getState()
      assert.equal(state.seedWords, null)
    })

    it('should set the seedWords property in state', function () {
      assert.equal(preferencesController.store.getState().seedWords, null)

      preferencesController.setSeedWords('foo bar baz')

      assert.equal(preferencesController.store.getState().seedWords, 'foo bar baz')
    })
  })

  describe('#updateRpc', function () {
    it('should update the rpcDetails properly', () => {
      preferencesController.store.updateState({frequentRpcListDetail: [{}, { rpcUrl: 'test' }, {}]})
      preferencesController.updateRpc({ rpcUrl: 'test', chainId: 1 })
      preferencesController.updateRpc({ rpcUrl: 'test/1', chainId: 1 })
      preferencesController.updateRpc({ rpcUrl: 'test/2', chainId: 1 })
      preferencesController.updateRpc({ rpcUrl: 'test/3', chainId: 1 })
      const list = preferencesController.getFrequentRpcListDetail()
      assert.deepEqual(list[1], { rpcUrl: 'test', chainId: 1 })
    })
  })

  describe('on updateFrequentRpcList', function () {
    it('should add custom RPC url to state', function () {
      preferencesController.addToFrequentRpcList('rpc_url', 1)
      preferencesController.addToFrequentRpcList('http://localhost:8545', 1)
      assert.deepEqual(preferencesController.store.getState().frequentRpcListDetail, [{ rpcUrl: 'rpc_url', chainId: 1, ticker: 'ETH', nickname: '', rpcPrefs: {} }])
      preferencesController.addToFrequentRpcList('rpc_url', 1)
      assert.deepEqual(preferencesController.store.getState().frequentRpcListDetail, [{ rpcUrl: 'rpc_url', chainId: 1, ticker: 'ETH', nickname: '', rpcPrefs: {} }])
    })

    it('should remove custom RPC url from state', function () {
      preferencesController.addToFrequentRpcList('rpc_url', 1)
      assert.deepEqual(preferencesController.store.getState().frequentRpcListDetail, [{ rpcUrl: 'rpc_url', chainId: 1, ticker: 'ETH', nickname: '', rpcPrefs: {} }])
      preferencesController.removeFromFrequentRpcList('other_rpc_url')
      preferencesController.removeFromFrequentRpcList('http://localhost:8545')
      preferencesController.removeFromFrequentRpcList('rpc_url')
      assert.deepEqual(preferencesController.store.getState().frequentRpcListDetail, [])
    })
  })
})

