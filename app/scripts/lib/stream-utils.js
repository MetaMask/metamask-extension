import ObjectMultiplex from '@metamask/object-multiplex';
import { pipeline } from 'readable-stream';

import { EXTENSION_MESSAGES } from '../../../shared/constants/app';

/**
 * Sets up stream multiplexing for the given stream
 *
 * @param {any} connectionStream - the stream to mux
 * @returns {stream.Stream} the multiplexed stream
 */
export function setupMultiplex(connectionStream) {
  const mux = new ObjectMultiplex();
  /**
   * We are using this streams to send keep alive message between backend/ui without setting up a multiplexer
   * We need to tell the multiplexer to ignore them, else we get the " orphaned data for stream " warnings
   * https://github.com/MetaMask/object-multiplex/blob/280385401de84f57ef57054d92cfeb8361ef2680/src/ObjectMultiplex.ts#L63
   */
  mux.ignoreStream(EXTENSION_MESSAGES.CONNECTION_READY);
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
