import { WindowPostMessageStream } from '@metamask/post-message-stream';
import ObjectMultiplex from '@metamask/object-multiplex';
import { pipeline, Transform } from 'readable-stream';
import { logStreamDisconnectWarning } from './shared';

// For more information about these legacy streams, see here:
// https://github.com/MetaMask/metamask-extension/issues/15491
// TODO:LegacyProvider: Delete
const LEGACY_CONTENT_SCRIPT = 'contentscript';
const LEGACY_INPAGE = 'inpage';
const LEGACY_PROVIDER = 'provider';
const LEGACY_PUBLIC_CONFIG = 'publicConfig';
const PROVIDER = 'metamask-provider';
const INPAGE = 'metamask-inpage';

let legacyExtMux,
  legacyExtChannel,
  legacyExtPublicConfigChannel,
  legacyPageMux,
  legacyPageMuxLegacyProviderChannel,
  legacyPagePublicConfigChannel,
  notificationTransformStream;

/**
 * This function must ONLY be called in pipeline destruction/close callbacks.
 * Notifies the inpage context that streams have failed, via window.postMessage.
 * Relies on @metamask/object-multiplex and post-message-stream implementation details.
 */
export function notifyInpageOfStreamFailure() {
  window.postMessage(
    {
      target: INPAGE, // the post-message-stream "target"
      data: {
        // this object gets passed to @metamask/object-multiplex
        name: PROVIDER, // the @metamask/object-multiplex channel name
        data: {
          jsonrpc: '2.0',
          method: 'METAMASK_STREAM_FAILURE',
        },
      },
    },
    window.location.origin,
  );
}
/**
 * LEGACY STREAM LOGIC
 * TODO:LegacyProvider: Delete
 */
// TODO:LegacyProvider: Delete
function getNotificationTransformStream() {
  const stream = new Transform({
    highWaterMark: 16,
    objectMode: true,
    transform: (chunk, _, cb) => {
      if (chunk?.name === PROVIDER) {
        if (chunk.data?.method === 'metamask_accountsChanged') {
          chunk.data.method = 'wallet_accountsChanged';
          chunk.data.result = chunk.data.params;
          delete chunk.data.params;
        }
      }
      cb(null, chunk);
    },
  });
  return stream;
}

// TODO:LegacyProvider: Delete
export const setupLegacyPageStreams = () => {
  const legacyPageStream = new WindowPostMessageStream({
    name: LEGACY_CONTENT_SCRIPT,
    target: LEGACY_INPAGE,
  });

  legacyPageMux = new ObjectMultiplex();
  legacyPageMux.setMaxListeners(25);

  pipeline(legacyPageMux, legacyPageStream, legacyPageMux, (err) =>
    logStreamDisconnectWarning('MetaMask Legacy Inpage Multiplex', err),
  );

  legacyPageMuxLegacyProviderChannel =
    legacyPageMux.createStream(LEGACY_PROVIDER);
  legacyPagePublicConfigChannel =
    legacyPageMux.createStream(LEGACY_PUBLIC_CONFIG);
};

// TODO:LegacyProvider: Delete
export const setupLegacyExtensionStreams = (extensionStream) => {
  legacyExtMux = new ObjectMultiplex();
  legacyExtMux.setMaxListeners(25);

  notificationTransformStream = getNotificationTransformStream();
  pipeline(
    legacyExtMux,
    extensionStream,
    notificationTransformStream,
    legacyExtMux,
    (err) => {
      logStreamDisconnectWarning('MetaMask Background Legacy Multiplex', err);
      notifyInpageOfStreamFailure();
    },
  );

  legacyExtChannel = legacyExtMux.createStream(PROVIDER);
  pipeline(
    legacyPageMuxLegacyProviderChannel,
    legacyExtChannel,
    legacyPageMuxLegacyProviderChannel,
    (error) =>
      console.debug(
        `MetaMask: Muxed traffic between channels "${LEGACY_PROVIDER}" and "${PROVIDER}" failed.`,
        error,
      ),
  );

  legacyExtPublicConfigChannel =
    legacyExtMux.createStream(LEGACY_PUBLIC_CONFIG);
  pipeline(
    legacyPagePublicConfigChannel,
    legacyExtPublicConfigChannel,
    legacyPagePublicConfigChannel,
    (error) =>
      console.debug(
        `MetaMask: Muxed traffic for channel "${LEGACY_PUBLIC_CONFIG}" failed.`,
        error,
      ),
  );
};

/**
 * Destroys all of the legacy extension streams
 * TODO:LegacyProvider: Delete
 */
export const destroyLegacyExtensionStreams = () => {
  legacyPageMuxLegacyProviderChannel.removeAllListeners();
  legacyPagePublicConfigChannel.removeAllListeners();

  legacyExtMux.removeAllListeners();
  legacyExtMux.destroy();

  legacyExtChannel.removeAllListeners();
  legacyExtChannel.destroy();

  legacyExtPublicConfigChannel.removeAllListeners();
  legacyExtPublicConfigChannel.destroy();
};
