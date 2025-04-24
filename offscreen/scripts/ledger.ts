import {
  LedgerAction,
  OffscreenCommunicationTarget,
} from '../../shared/constants/offscreen-communication';
import LedgerHandler from './ledger/ledger-handler';

const ledgerHandler = new LedgerHandler();

function setupMessageListeners() {
  // This listener received action messages from the offscreen bridge
  // Then it forwards the message to the live ledger iframe
  chrome.runtime.onMessage.addListener(
    async (
      msg: {
        target: string;
        action: LedgerAction;

        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        params: any;
      },
      _sender,
      sendResponse,
    ) => {
      if (msg.target !== OffscreenCommunicationTarget.ledgerOffscreen) {
        return;
      }

      switch (msg.action) {
        case LedgerAction.makeApp:
          ledgerHandler.makeEthApp();
          sendResponse({
            success: true,
            payload: {},
          });

          break;
        case LedgerAction.updateTransport:
          sendResponse({
            success: true,
            payload: {},
          });

          break;
        case LedgerAction.unlock:
          const result = await ledgerHandler.unlock(msg.params);
          sendResponse({
            success: true,
            payload: result,
          });
          break;
        case LedgerAction.getPublicKey:
          break;
        case LedgerAction.signTransaction:
          break;
        case LedgerAction.signPersonalMessage:
          break;
        case LedgerAction.signTypedData:
          break;
        default:
          sendResponse({
            success: false,
            payload: {
              error: 'Ledger action not supported',
            },
          });
          break;
      }
    },
  );
}

export default async function init() {
  return setupMessageListeners();
}
