/*global ethereum */
const EventEmitter = require('events')

/**
 * This class exposes the standard Ethereum provider API as per
 * https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1193.md
 */
class EthereumProvider extends EventEmitter {
  _isConnected

  constructor () {
    super()
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
    (this._isConnected === undefined || this._isConnected) && this.emit('close', {
      code: 1011,
      reason: 'Network connection error',
    })
    this._isConnected = false
  }

  _onConnect () {
    !this._isConnected && this.emit('connect')
    this._isConnected = true
  }

  async _ping () {
    try {
      await this.send('eth_blockNumber')
      window.postMessage({ type: 'ethereumpingsuccess' }, '*')
    } catch (error) {
      window.postMessage({ type: 'ethereumpingerror' }, '*')
    }
  }

  _subscribe () {
    ethereum.on('networkChanged', data => { this.emit('networkChanged', data) })
    ethereum.on('accountsChanged', data => { this.emit('accountsChanged', data) })
    ethereum.on('data', (error, { method, params }) => {
      if (!error && method === 'eth_subscription') {
        this.emit('notification', params.result)
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
    if (method === 'eth_requestAccounts') return ethereum.enable()

    return new Promise((resolve, reject) => {
      try {
        ethereum.sendAsync({ method, params, beta: true }, (error, response) => {
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

window.ethereumBeta = new EthereumProvider()
