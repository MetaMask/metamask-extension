import PortStream from 'extension-port-stream'
const makeCapTpFromStream = require('captp-stream')
const harden = require('@agoric/harden')
const extension = require('extensionizer')
const createLogStream = require('./lib/create-log-stream')
import ObjectMultiplex from 'obj-multiplex'

import { lockdown } from "ses"
lockdown();

import { createCore } from './core'
const hardcore = createCore()
console.log('core is ', hardcore)

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

extension.runtime.onConnect.addListener(connectRemote)
extension.runtime.onConnectExternal.addListener(connectExternal)

function connectRemote (remotePort) {
  const processName = remotePort.name
  const isMetaMaskInternalProcess = metamaskInternalProcessHash[processName]

  if (isMetaMaskInternalProcess) {
    setupTrustedCommunication(remotePort)
  } else {
    setupUntrustedCommunication(remotePort)
  }
}

function setupUntrustedCommunication (port) {
  const portStream = new PortStream(port)
  portStream.pipe(createLogStream('incomingToBackground'))
  const { abort } = makeCapTpFromStream('untrusted', portStream, hardcore);
  portStream.on('end', () => abort())
}

function setupTrustedCommunication (port) {
  const portStream = new PortStream(port)
  portStream.pipe(createLogStream('incomingToBackground'))
  const { abort } = makeCapTpFromStream('trusted', portStream, hardcore);
  portStream.on('end', () => abort())
}

// communication with page or other extension
function connectExternal (remotePort) {
  const portStream = new PortStream(remotePort)
  const { abort } = makeCapTpFromStream('external', portStream, hardcore);

  // Clean up references to remote pending functions
  portStream.on('end', () => abort())
}

/**
 * Error handler for page to extension stream disconnections
 *
 * @param {string} remoteLabel - Remote stream name
 * @param {Error} err - Stream connection error
 */
function logStreamDisconnectWarning (remoteLabel, err) {
  let warningMsg = `MetamaskContentscript - lost connection to ${remoteLabel}`
  if (err) {
    warningMsg += '\n' + err.stack
  }
  console.warn(warningMsg)
}

