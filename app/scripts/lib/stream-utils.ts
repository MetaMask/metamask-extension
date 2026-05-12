import ObjectMultiplex from '@metamask/object-multiplex';
// @ts-expect-error @types/readable-stream does not export pipeline or Duplex
import { pipeline, Duplex } from 'readable-stream';

/**
 * A stream-like object that exposes the internal properties accessed by
 * {@link isStreamWritable} across different stream implementations (node:stream,
 * readable-stream v2/v3/v4 and @metamask/object-multiplex).
 */
type StreamLike = {
  writable?: boolean;
  destroyed?: boolean;
  _writableState?: { ended: boolean };
};

// TODO: Move these to `shared/lib/stream-utils.ts`.

/**
 * Sets up stream multiplexing for the given stream
 *
 * @param connectionStream - the stream to mux
 * @returns the multiplexed stream
 */
export function setupMultiplex(connectionStream: Duplex): ObjectMultiplex {
  const mux = new ObjectMultiplex();
  pipeline(connectionStream, mux, connectionStream, (err: Error | null) => {
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
 * @param stream - the stream to check
 * @returns if the stream can be written to
 */
export function isStreamWritable(stream: StreamLike): boolean {
  /*
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
