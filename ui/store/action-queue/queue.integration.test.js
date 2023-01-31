import sinon from 'sinon';
import PortStream from 'extension-port-stream';
import { setupMultiplex } from '../../../app/scripts/lib/stream-utils';
import metaRPCClientFactory from '../../../app/scripts/lib/metaRPCClientFactory';

import {
  dropQueue,
  submitRequestToBackground,
  _setBackgroundConnection,
} from '.';

jest.mock('../../../shared/modules/mv3.utils', () => {
  return {
    isManifestV3: () => true,
  };
});

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

describe('queue integration test', () => {
  afterEach(() => {
    dropQueue(true);
  });
  it('schedules a retry if background method failed because of a disconnect', async () => {
    let disconnectListener;
    const extensionPort = {
      onMessage: {
        addListener: sinon.stub(),
      },
      onDisconnect: {
        addListener(cb) {
          disconnectListener = cb;
        },
      },
      postMessage: sinon.stub().callsFake(() => {
        disconnectListener();
      }),
    };

    const connectionStream = new PortStream(extensionPort);
    const mx = setupMultiplex(connectionStream);
    const multiplexStream1 = mx.createStream('controller');
    const background = metaRPCClientFactory(multiplexStream1);

    _setBackgroundConnection(background);

    // disconnect will happen on the attempt to send the message
    const finished = submitRequestToBackground('backgroundFunction').catch(
      (error) => {
        // disconnect error should not get propagated, we retry.
        // eslint-disable-next-line jest/no-conditional-expect
        expect(error).not.toBeInstanceOf(background.DisconnectError);
        // eslint-disable-next-line jest/no-conditional-expect
        expect(error.message).toContain('cancelled');
      },
    );
    // We want to make sure we disconnect in the middle of processing, so we have to wait for the control flow to reach postMessage
    // undetermined number of asynchronous jumps withing the stream implementation leaves no other option
    await wait(3);
    // we drop the queue because we're expecting the action to have been returned to the queue and this is the simplest way to check that
    dropQueue();

    expect(extensionPort.postMessage.calledOnce).toStrictEqual(true);
    await finished;
  });
});
