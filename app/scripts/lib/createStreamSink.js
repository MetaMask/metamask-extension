import { Writable as WritableStream } from 'readable-stream';
import promiseToCallback from 'promise-to-callback';

class AsyncWritableStream extends WritableStream {
  constructor(asyncWriteFn, _opts) {
    const opts = { objectMode: true, ..._opts };
    super(opts);
    this._asyncWriteFn = asyncWriteFn;
  }

  // write from incoming stream to state
  _write(chunk, encoding, callback) {
    promiseToCallback(this._asyncWriteFn(chunk, encoding))(callback);
  }
}

export default function createStreamSink(asyncWriteFn, _opts) {
  return new AsyncWritableStream(asyncWriteFn, _opts);
}
