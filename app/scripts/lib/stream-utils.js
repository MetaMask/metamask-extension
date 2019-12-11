const ObjectMultiplex = require('obj-multiplex')
const pump = require('pump')

module.exports = {
  setupMultiplex: setupMultiplex,
}

/**
 * Sets up stream multiplexing for the given stream
 * @param {any} connectionStream - the stream to mux
 * @return {stream.Stream} the multiplexed stream
 */
function setupMultiplex (connectionStream) {
  const mux = new ObjectMultiplex()
  pump(
    connectionStream,
    mux,
    connectionStream,
    (err) => {
      if (err) {
        console.error(err)
      }
    }
  )
  return mux
}
