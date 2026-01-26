import {
  AbstractExecutionService,
  IframeExecutionService,
  OffscreenExecutionService,
} from '@metamask/snaps-controllers';
import { assert } from '@metamask/utils';
import { SubjectType } from '@metamask/permission-controller';
import { Duplex } from 'readable-stream';
import { ControllerInitFunction } from '../types';
import { isManifestV3 } from '../../../../shared/modules/mv3.utils';
import { ExecutionServiceMessenger } from '../messengers/snaps';

/**
 * Initialize the Snaps execution service.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the service.
 * @param request.offscreenPromise - The promise that resolves when the
 * offscreen document is ready.
 * @param request.setupUntrustedCommunicationEip1193 - The setup function for
 * EIP-1193 communication.
 * @returns The initialized controller.
 */
export const ExecutionServiceInit: ControllerInitFunction<
  AbstractExecutionService<unknown>,
  ExecutionServiceMessenger
> = ({
  controllerMessenger,
  offscreenPromise,
  setupUntrustedCommunicationEip1193,
}) => {
  const useOffscreenDocument =
    isManifestV3 &&
    typeof chrome !== 'undefined' &&
    typeof chrome.offscreen !== 'undefined';

  /**
   * Set up the EIP-1193 provider for the given Snap.
   *
   * @param snapId - The ID of the Snap.
   * @param connectionStream - The stream to connect to the Snap.
   */
  function setupSnapProvider(snapId: string, connectionStream: Duplex) {
    setupUntrustedCommunicationEip1193({
      connectionStream,
      sender: { snapId },
      subjectType: SubjectType.Snap,
    });
  }

  if (useOffscreenDocument) {
    return {
      memStateKey: null,
      persistedStateKey: null,
      controller: new OffscreenExecutionService({
        messenger: controllerMessenger,
        setupSnapProvider,
        offscreenPromise,
      }),
    };
  }

  const iframeUrl = process.env.IFRAME_EXECUTION_ENVIRONMENT_URL;
  assert(iframeUrl, 'Missing iframe URL.');

  return {
    memStateKey: null,
    persistedStateKey: null,
    controller: new IframeExecutionService({
      messenger: controllerMessenger,
      iframeUrl: new URL(iframeUrl),
      setupSnapProvider,
    }),
  };
};
