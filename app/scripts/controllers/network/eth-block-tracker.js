const pify = require('pify')
const OriginalPollingBlockTracker = require('eth-block-tracker')

class PollingBlockTracker extends OriginalPollingBlockTracker {
  async _fetchLatestBlock() {
    const req = {
      jsonrpc: '2.0',
      id: 1,
      method: 'cfx_epochNumber',
      params: ['latest_state'],
    }

    if (this._setSkipCacheFlag) {
      req.skipCache = true
    }
    const res = await pify(cb => this._provider.sendAsync(req, cb))()
    if (res.error) {
      throw new Error(
        `PollingBlockTracker - encountered error fetching block:\n${res.error}`
      )
    }
    return res.result
  }
}
module.exports = PollingBlockTracker
