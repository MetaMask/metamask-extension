import { installBrazeWorkerEnvironment } from './braze-worker-environment';
import {
  handleBrazeWorkerRequest,
  type BrazeWorkerResponse,
} from './braze-worker-messages';

installBrazeWorkerEnvironment();

// Never statically import the SDK: its module initialization reads globals.
const host = import('./braze-sdk-host').then(({ createBrazeSdkHost }) =>
  createBrazeSdkHost(),
);

// Keep the channel in trusted code. SDK messages can only resolve/reject an
// outstanding sync request; the page has no DOM operation on this channel.
const reply = globalThis.postMessage.bind(globalThis) as (
  message: BrazeWorkerResponse,
) => void;

globalThis.addEventListener('message', (event: MessageEvent<unknown>) => {
  handleBrazeWorkerRequest(event.data, host).then((response) => {
    if (response) {
      reply(response);
    }
  });
});
