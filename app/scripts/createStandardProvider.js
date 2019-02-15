class StandardProvider {
  _isConnected
  _provider

  constructor (provider) {
    this._provider = provider
    this._onMessage('ethereumpingerror', this._onClose.bind(this))
    this._onMessage('ethereumpingsuccess', this._onConnect.bind(this))
    window.addEventListener('load', () => {
      this._subscribe()
      this._ping()
    })
  }

  _onMessage (type, handler) {
    window.addEventListener('message', function ({ data }) {
      if (!data || data.type !== type) return
      handler.apply(this, arguments)
    })
  }

  _onClose () {
    (this._isConnected === undefined || this._isConnected) && this._provider.emit('close', {
      code: 1011,
      reason: 'Network connection error',
    })
    this._isConnected = false
  }

  _onConnect () {
    !this._isConnected && this._provider.emit('connect')
    this._isConnected = true
  }

  async _ping () {
    try {
      await this.send('eth_blockNumber', undefined, true)
      window.postMessage({ type: 'ethereumpingsuccess' }, '*')
    } catch (error) {
      window.postMessage({ type: 'ethereumpingerror' }, '*')
    }
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
    if (method === 'eth_requestAccounts') return this._provider.enable()

    return new Promise((resolve, reject) => {
      try {
        this._provider.sendAsync({ method, params, beta: true }, (error, response) => {
          error = error || response.error
          error ? reject(error) : resolve(response)
        })
      } catch (error) {
        // Per EIP-1193, send should never throw, only reject its Promise. Here
        // we swallow thrown errors, which is safe since we handle them above.
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
  provider.send = (a, b) => {
    if (typeof payload === 'string' && !b || Array.isArray(b)) {
      return standardProvider.send(a, b)
    }
    return sendLegacy.call(provider, a, b)
  }
  return provider
}
