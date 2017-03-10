/*
const urlUtil = require('url')
const extend = require('xtend')
const Dnode = require('dnode')
const eos = require('end-of-stream')
const ParentStream = require('iframe-stream').ParentStream
const PortStream = require('../app/scripts/lib/port-stream.js')
const notification = require('../app/scripts/lib/notifications.js')
const messageManager = require('../app/scripts/lib/message-manager')
const setupMultiplex = require('../app/scripts/lib/stream-utils.js').setupMultiplex
const MetamaskController = require('../app/scripts/metamask-controller')
const extension = require('../app/scripts/lib/extension')

const STORAGE_KEY = 'metamask-config'


initializeZeroClient()

function initializeZeroClient() {

  const controller = new MetamaskController({
    // User confirmation callbacks:
    showUnconfirmedMessage,
    unlockAccountMessage,
    showUnapprovedTx,
    // Persistence Methods:
    setData,
    loadData,
  })
  const idStore = controller.idStore

  function unlockAccountMessage () {
    console.log('notif stub - unlockAccountMessage')
  }

  function showUnconfirmedMessage (msgParams, msgId) {
    console.log('notif stub - showUnconfirmedMessage')
  }

  function showUnapprovedTx (txParams, txData, onTxDoneCb) {
    console.log('notif stub - showUnapprovedTx')
  }

  //
  // connect to other contexts
  //

  var connectionStream = new ParentStream()

  connectRemote(connectionStream, getParentHref())

  function connectRemote (connectionStream, originDomain) {
    var isMetaMaskInternalProcess = (originDomain === '127.0.0.1:9001')
    if (isMetaMaskInternalProcess) {
      // communication with popup
      setupTrustedCommunication(connectionStream, 'MetaMask')
    } else {
      // communication with page
      setupUntrustedCommunication(connectionStream, originDomain)
    }
  }

  function setupUntrustedCommunication (connectionStream, originDomain) {
    // setup multiplexing
    var mx = setupMultiplex(connectionStream)
    // connect features
    controller.setupProviderConnection(mx.createStream('provider'), originDomain)
    controller.setupPublicConfig(mx.createStream('publicConfig'))
  }

  function setupTrustedCommunication (connectionStream, originDomain) {
    // setup multiplexing
    var mx = setupMultiplex(connectionStream)
    // connect features
    setupControllerConnection(mx.createStream('controller'))
    controller.setupProviderConnection(mx.createStream('provider'), originDomain)
  }

  //
  // remote features
  //

  function setupControllerConnection (stream) {
    controller.stream = stream
    var api = controller.getApi()
    var dnode = Dnode(api)
    stream.pipe(dnode).pipe(stream)
    dnode.on('remote', (remote) => {
      // push updates to popup
      controller.ethStore.on('update', controller.sendUpdate.bind(controller))
      controller.listeners.push(remote)
      idStore.on('update', controller.sendUpdate.bind(controller))

      // teardown on disconnect
      eos(stream, () => {
        controller.ethStore.removeListener('update', controller.sendUpdate.bind(controller))
      })
    })
  }

  function loadData () {
    var oldData = getOldStyleData()
    var newData
    try {
      newData = JSON.parse(window.localStorage[STORAGE_KEY])
    } catch (e) {}

    var data = extend({
      meta: {
        version: 0,
      },
      data: {
        config: {
          provider: {
            type: 'testnet',
          },
        },
      },
    }, oldData || null, newData || null)
    return data
  }

  function getOldStyleData () {
    var config, wallet, seedWords

    var result = {
      meta: { version: 0 },
      data: {},
    }

    try {
      config = JSON.parse(window.localStorage['config'])
      result.data.config = config
    } catch (e) {}
    try {
      wallet = JSON.parse(window.localStorage['lightwallet'])
      result.data.wallet = wallet
    } catch (e) {}
    try {
      seedWords = window.localStorage['seedWords']
      result.data.seedWords = seedWords
    } catch (e) {}

    return result
  }

  function setData (data) {
    window.localStorage[STORAGE_KEY] = JSON.stringify(data)
  }

  function getParentHref(){
    try {
      var parentLocation = window.parent.location
      return parentLocation.hostname + ':' + parentLocation.port
    } catch (err) {
      return 'unknown'
    }
  }

}

*/
const SWcontroller = require('./sw-controller')
console.log('outside:open')
const background = new SWcontroller({
  fileName: 'sw-build.js',
  registerOpts: {
    scope: './',
  }
})

background.startWorker()
.then(registerdWorker => {
  return background.sendMessage('connect')
})
.then((port) => {
  debugger
})
.catch(err => {
  console.error(`SW Controller: ${err}`)
})
