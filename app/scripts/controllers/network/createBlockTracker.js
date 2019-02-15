const BlockTracker = require('eth-block-tracker')

/**
 * Creates a block tracker that sends platform events on success and failure
 */
module.exports = function createBlockTracker (args, platform) {
  const blockTracker = new BlockTracker(args)
  blockTracker.on('latest', () => {
    platform && platform.sendMessage && platform.sendMessage({ action: 'ethereum-ping-success' })
  })
  blockTracker.on('error', () => {
    platform && platform.sendMessage && platform.sendMessage({ action: 'ethereum-ping-error' })
  })
  return blockTracker
}
