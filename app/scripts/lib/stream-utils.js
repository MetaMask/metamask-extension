import ObjectMultiplex from '@metamask/object-multiplex';
import { finished, pipeline } from 'readable-stream';

/**
 * Sets up stream multiplexing for the given stream
 *
 * @param {any} connectionStream - the stream to mux
 * @returns {stream.Stream} the multiplexed stream
 */
export function setupMultiplex(connectionStream) {
  const mux = new ObjectMultiplex();
  pipeline(connectionStream, mux, connectionStream, (err) => {
    // For context and todos related to the error message match, see https://github.com/MetaMask/metamask-extension/issues/26337
    if (err && !err.message?.match('Premature close')) {
      console.error(err);
    }
  });
  return mux;
}

/**
 * Checks if a stream is writable and usable
 *
 * @param {stream.Stream} stream - the stream to check
 * @returns {boolean} if the stream can be written to
 */
export function isStreamWritable(stream) {
  /**
   * Roughly:
   *   stream.writable:
   *     readable-stream-3 (confusingly: not mentioned in docs for streamsv2 and not consistently implemented there, despite v3 docs mentioning it as older)
   *     readable-stream-4/NodeStream (here it's mentioned as introduced much later)
   *   stream.destroyed:
   *     readable-stream-4/NodeStream (docs mention it as introduced in v2 despite being absent from both implementation and docs of v2 and v3)
   *   stream._writableState.ended:
   *     Present in all implementations, seems like the most reasonable fallback for legacy.
   *
   * The only accurate references seem to be sources for Node.js and readable-stream. Intended compatibility must be ensured by tests.
   */

  return Boolean(
    stream.writable && !stream.destroyed && !stream._writableState?.ended,
  );
}

/**
 * Calls the given callback when the stream ends.
 *
 * Supports `readable-stream` v2 and v3.
 *
 * @param {stream.Stream} stream - A stream.
 * @param {() => void} callback - The function to call when the stream ends.
 */
export function onStreamClosed(stream, callback) {
  // There is some redundant-looking code here: we have three ways of detecting
  // whether the stream is closed, and we are using an ad-hoc `mmFinished`
  // property to prevent the callback from being called if it's already been
  // called.
  //
  // For context, a previous change upgraded `@metamask/object-multiplex` from
  // v2 to v3, and with it, `readable-stream` was upgraded from v2 to v3. After
  // this update, we saw new "premature close" errors in the background. It
  // seems that these errors were already present in v2, but they were handled
  // differently, resulting in an "error" event. As of v3, this does not happen,
  // but particularly, the "end" event is no longer called.
  //
  // We still have not established a definitive understanding of why these
  // errors are happening in the first place, and follow up investigation will
  // be needed. In the meantime, to address this issue and protect against
  // unexpected behavioral changes in future `readable-streams` version, we
  // redundantly use multiple paths to attach the same event handler. In case
  // any handler is called twice we use an ad-hoc property to ensure it only
  // runs once.
  //
  // (This is a rewritten version of the comment added in
  // 8f6c83e2c29fa1a200afc03e9adce2d22ac5dd47)

  stream.mmFinished = false;
  const wrappedCallback = () => {
    if (stream.mmFinished) {
      return undefined;
    }

    try {
      return callback();
    } finally {
      stream.mmFinished = true;
    }
  };

  finished(stream, wrappedCallback);
  stream.once('close', wrappedCallback);
  stream.once('end', wrappedCallback);
}
