const BlockTracker = require('eth-block-tracker')

/**
 * Creates a block tracker that sends platform events on success and failure
 */
module.exports = function createBlockTracker (args, platform) {
  const blockTracker = new BlockTracker(args)
  blockTracker.on('latest', () => {
    if (platform && platform.sendMessage) {
      platform.sendMessage({ action: 'ethereum-ping-success' })
    }
  })
  blockTracker.on('error', () => {
    if (platform && platform.sendMessage) {
      platform.sendMessage({ action: 'ethereum-ping-error' })
    }
  })
  return blockTracker
}
