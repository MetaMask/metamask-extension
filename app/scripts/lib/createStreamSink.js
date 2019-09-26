const WritableStream = require('readable-stream').Writable
const promiseToCallback = require('promise-to-callback')

class AsyncWritableStream extends WritableStream {

  constructor (asyncWriteFn, _opts) {
    const opts = Object.assign({ objectMode: true }, _opts)
    super(opts)
    this._asyncWriteFn = asyncWriteFn
  }

  // write from incomming stream to state
  _write (chunk, encoding, callback) {
    promiseToCallback(this._asyncWriteFn(chunk, encoding))(callback)
  }

}

function createStreamSink (asyncWriteFn, _opts) {
  return new AsyncWritableStream(asyncWriteFn, _opts)
}

module.exports = createStreamSink
