class StandardProvider {
  _isConnected
  _provider

  constructor (provider) {
    this._provider = provider
    this._subscribe()
    // indicate that we've connected, mostly just for standard compliance
    setTimeout(() => {
      this._onConnect()
    })
  }

  _onClose () {
    if (this._isConnected === undefined || this._isConnected) {
      this._provider.emit('close', {
        code: 1011,
        reason: 'Network connection error',
      })
    }
    this._isConnected = false
  }

  _onConnect () {
    !this._isConnected && this._provider.emit('connect')
    this._isConnected = true
  }

  _subscribe () {
    this._provider.on('data', (error, { method, params }) => {
      if (!error && method === 'eth_subscription') {
        this._provider.emit('notification', params.result)
      }
    })
  }

  /**
   * Initiate an RPC method call
   *
   * @param {string} method - RPC method name to call
   * @param {string[]} params - Array of RPC method parameters
   * @returns {Promise<*>} Promise resolving to the result if successful
   */
  send (method, params = []) {
    return new Promise((resolve, reject) => {
      try {
        this._provider.sendAsync({ id: 1, jsonrpc: '2.0', method, params }, (error, response) => {
          error = error || response.error
          error ? reject(error) : resolve(response)
        })
      } catch (error) {
        reject(error)
      }
    })
  }
}

/**
 * Converts a legacy provider into an EIP-1193-compliant standard provider
 * @param {Object} provider - Legacy provider to convert
 * @returns {Object} Standard provider
 */
export default function createStandardProvider (provider) {
  const standardProvider = new StandardProvider(provider)
  const sendLegacy = provider.send
  provider.send = (methodOrPayload, callbackOrArgs) => {
    if (typeof methodOrPayload === 'string' && !callbackOrArgs || Array.isArray(callbackOrArgs)) {
      return standardProvider.send(methodOrPayload, callbackOrArgs)
    }
    return sendLegacy.call(provider, methodOrPayload, callbackOrArgs)
  }
  return provider
}
