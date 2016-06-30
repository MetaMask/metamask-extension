const extend = require('xtend')
const EthStore = require('eth-store')
const MetaMaskProvider = require('web3-provider-engine/zero.js')
const IdentityStore = require('./lib/idStore')
const messageManager = require('./lib/message-manager')
const HostStore = require('./lib/remote-store.js').HostStore
const Web3 = require('web3')
const ConfigManager = require('./lib/config-manager')

module.exports = class MetamaskController {

  constructor (opts) {
    this.opts = opts
    this.configManager = new ConfigManager(opts)
    this.idStore = new IdentityStore({
      configManager: this.configManager,
    })
    this.provider = this.initializeProvider(opts)
    this.ethStore = new EthStore(this.provider)
    this.idStore.setStore(this.ethStore)
    this.messageManager = messageManager
    this.publicConfigStore = this.initPublicConfigStore()
  }

  getState () {
    return extend(
      this.ethStore.getState(),
      this.idStore.getState(),
      this.configManager.getConfig()
    )
  }

  getApi () {
    const idStore = this.idStore

    return {
      getState: (cb) => { cb(null, this.getState()) },
      setRpcTarget: this.setRpcTarget.bind(this),
      setProviderType: this.setProviderType.bind(this),
      useEtherscanProvider: this.useEtherscanProvider.bind(this),
      agreeToDisclaimer: this.agreeToDisclaimer.bind(this),
      // forward directly to idStore
      createNewVault: idStore.createNewVault.bind(idStore),
      recoverFromSeed: idStore.recoverFromSeed.bind(idStore),
      submitPassword: idStore.submitPassword.bind(idStore),
      setSelectedAddress: idStore.setSelectedAddress.bind(idStore),
      approveTransaction: idStore.approveTransaction.bind(idStore),
      cancelTransaction: idStore.cancelTransaction.bind(idStore),
      signMessage: idStore.signMessage.bind(idStore),
      cancelMessage: idStore.cancelMessage.bind(idStore),
      setLocked: idStore.setLocked.bind(idStore),
      clearSeedWordCache: idStore.clearSeedWordCache.bind(idStore),
      exportAccount: idStore.exportAccount.bind(idStore),
      revealAccount: idStore.revealAccount.bind(idStore),
      saveAccountLabel: idStore.saveAccountLabel.bind(idStore),
      tryPassword: idStore.tryPassword.bind(idStore),
      recoverSeed: idStore.recoverSeed.bind(idStore),
    }
  }

  setupProviderConnection (stream, originDomain) {
    stream.on('data', this.onRpcRequest.bind(this, stream, originDomain))
  }

  onRpcRequest (stream, originDomain, request) {
    var payloads = Array.isArray(request) ? request : [request]
    payloads.forEach(function (payload) {
      // Append origin to rpc payload
      payload.origin = originDomain
      // Append origin to signature request
      if (payload.method === 'eth_sendTransaction') {
        payload.params[0].origin = originDomain
      } else if (payload.method === 'eth_sign') {
        payload.params.push({ origin: originDomain })
      }
    })

    // handle rpc request
    this.provider.sendAsync(request, function onPayloadHandled (err, response) {
      if (err) {
        return logger(err)
      }
      logger(null, request, response)
      try {
        stream.write(response)
      } catch (err) {
        logger(err)
      }
    })

    function logger (err, request, response) {
      if (err) return console.error(err.stack)
      if (!request.isMetamaskInternal) {
        console.log(`RPC (${originDomain}):`, request, '->', response)
        if (response.error) console.error('Error in RPC response:\n' + response.error.message)
      }
    }
  }

  sendUpdate () {
    if (this.remote) {
      this.remote.sendUpdate(this.getState())
    }
  }

  initializeProvider (opts) {
    const idStore = this.idStore

    var providerOpts = {
      rpcUrl: this.configManager.getCurrentRpcAddress(),
      // account mgmt
      getAccounts: (cb) => {
        var selectedAddress = idStore.getSelectedAddress()
        var result = selectedAddress ? [selectedAddress] : []
        cb(null, result)
      },
      // tx signing
      approveTransaction: this.newUnsignedTransaction.bind(this),
      signTransaction: idStore.signTransaction.bind(idStore),
      // msg signing
      approveMessage: this.newUnsignedMessage.bind(this),
      signMessage: idStore.signMessage.bind(idStore),
    }

    var provider = MetaMaskProvider(providerOpts)
    var web3 = new Web3(provider)
    idStore.web3 = web3
    idStore.getNetwork()

    provider.on('block', this.processBlock.bind(this))
    provider.on('error', idStore.getNetwork.bind(idStore))

    return provider
  }

  initPublicConfigStore () {
    // get init state
    var initPublicState = extend(
      idStoreToPublic(this.idStore.getState()),
      configToPublic(this.configManager.getConfig())
    )

    var publicConfigStore = new HostStore(initPublicState)

    // subscribe to changes
    this.configManager.subscribe(function (state) {
      storeSetFromObj(publicConfigStore, configToPublic(state))
    })
    this.idStore.on('update', function (state) {
      storeSetFromObj(publicConfigStore, idStoreToPublic(state))
    })

    // idStore substate
    function idStoreToPublic (state) {
      return {
        selectedAddress: state.selectedAddress,
      }
    }
    // config substate
    function configToPublic (state) {
      return {
        provider: state.provider,
      }
    }
    // dump obj into store
    function storeSetFromObj (store, obj) {
      Object.keys(obj).forEach(function (key) {
        store.set(key, obj[key])
      })
    }

    return publicConfigStore
  }

  newUnsignedTransaction (txParams, onTxDoneCb) {
    const idStore = this.idStore
    var state = idStore.getState()

    // It's locked
    if (!state.isUnlocked) {
      this.opts.unlockAccountMessage()
      idStore.addUnconfirmedTransaction(txParams, onTxDoneCb, noop)

    // It's unlocked
    } else {
      idStore.addUnconfirmedTransaction(txParams, onTxDoneCb, (err, txData) => {
        if (err) return onTxDoneCb(err)
        this.opts.showUnconfirmedTx(txParams, txData, onTxDoneCb)
      })
    }
  }

  newUnsignedMessage (msgParams, cb) {
    var state = this.idStore.getState()
    if (!state.isUnlocked) {
      this.opts.unlockAccountMessage()
    } else {
      this.addUnconfirmedMessage(msgParams, cb)
    }
  }

  addUnconfirmedMessage (msgParams, cb) {
    const idStore = this.idStore
    const msgId = idStore.addUnconfirmedMessage(msgParams, cb)
    this.opts.showUnconfirmedMessage(msgParams, msgId)
  }

  setupPublicConfig (stream) {
    var storeStream = this.publicConfigStore.createStream()
    stream.pipe(storeStream).pipe(stream)
  }

  // Log blocks
  processBlock (block) {
    console.log(`BLOCK CHANGED: #${block.number.toString('hex')} 0x${block.hash.toString('hex')}`)
    this.verifyNetwork()
  }

  verifyNetwork () {
    // Check network when restoring connectivity:
    if (this.idStore._currentState.network === 'loading') {
      this.idStore.getNetwork()
    }
  }

  // config
  //

  agreeToDisclaimer (cb) {
    try {
      this.configManager.setConfirmed(true)
      cb()
    } catch (e) {
      cb(e)
    }
  }

  // called from popup
  setRpcTarget (rpcTarget) {
    this.configManager.setRpcTarget(rpcTarget)
    chrome.runtime.reload()
    this.idStore.getNetwork()
  }

  setProviderType (type) {
    this.configManager.setProviderType(type)
    chrome.runtime.reload()
    this.idStore.getNetwork()
  }

  useEtherscanProvider () {
    this.configManager.useEtherscanProvider()
    chrome.runtime.reload()
  }
}

function noop () {}
