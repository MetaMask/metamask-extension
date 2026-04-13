// @ts-expect-error The types do not include `finished`, but it is there.
import { finished } from 'readable-stream';

/**
 * Calls the given callback when the stream ends.
 *
 * Supports `readable-stream` v2 and v3.
 *
 * @param stream - A stream.
 * @param callback - The function to call when the stream ends.
 */
export function onStreamClosed(
  stream: (
    | NodeJS.ReadableStream
    | NodeJS.WritableStream
    | NodeJS.ReadWriteStream
  ) & {
    mmFinished?: boolean;
  },
  callback: () => void,
) {
  // There is some redundant-looking code here: we have three ways of detecting
  // whether the stream is closed, and we are setting and checking an ad-hoc
  // `mmFinished` property.
  //
  // For context, we upgraded `@metamask/object-multiplex` from v2 to v3, and
  // with it, `readable-stream` was upgraded from v2 to v3. After this change,
  // we observed two things:
  //
  // 1. The "end" event was not fired anymore, and thus our event handler was
  //    not called. This caused a bug, since we rely on stream closing to
  //    properly clean up UI connections.
  //    (See: https://github.com/MetaMask/metamask-extension/issues/26002)
  // 2. A new "premature close" message appeared in the console. It is possible
  //    that the stream was not completely read before the UI attempted to close
  //    it, or that the "end" event was not the right event to listen to in the
  //    first place.
  //
  // We attempted to investigate the root cause for both of these observations,
  // but did not reach a conclusion. To address this now and protect against
  // unexpected behavioral changes in future `readable-stream` versions, we
  // decided to use redundant approaches to listen for when the stream closes,
  // attaching the same handler in all cases. Since the handler calls our
  // callback, we add a property to the stream object and check it to ensure
  // that the callback runs idempotently.
  //
  // (This is a rewritten version of a previous comment. See here for more:
  // https://github.com/MetaMask/metamask-extension/commit/8f6c83e2c29fa1a200afc03e9adce2d22ac5dd47)

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
