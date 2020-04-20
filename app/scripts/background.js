import PortStream from 'extension-port-stream'
const makeCapTpFromStream = require('captp-stream')
const harden = require('@agoric/harden')
const extension = require('extensionizer')

import {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_NOTIFICATION,
  ENVIRONMENT_TYPE_FULLSCREEN
} from './lib/enums';

const metamaskInternalProcessHash = {
  [ENVIRONMENT_TYPE_POPUP]: true,
  [ENVIRONMENT_TYPE_NOTIFICATION]: true,
  [ENVIRONMENT_TYPE_FULLSCREEN]: true,
}

const api = harden({ foo: async () => 'bar' })

extension.runtime.onConnect.addListener(connectRemote)
extension.runtime.onConnectExternal.addListener(connectExternal)

function connectRemote (remotePort) {
  const processName = remotePort.name
  const isMetaMaskInternalProcess = metamaskInternalProcessHash[processName]

  if (!isMetaMaskInternalProcess) {
    return
  }

  const portStream = new PortStream(remotePort)
  const { abort } = makeCapTpFromStream('safe', portStream, api);

  // Clean up references to remote pending functions
  portStream.on('end', () => abort())
}

// communication with page or other extension
function connectExternal (remotePort) {
  const portStream = new PortStream(remotePort)
  const { abort } = makeCapTpFromStream('external', remotePort, api);

  // Clean up references to remote pending functions
  portStream.on('end', () => abort())
}

