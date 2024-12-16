import { BridgeStatusControllerBridgeTransactionCompleteEvent } from '../../controllers/bridge-status/types';

export const handleBridgeTransactionComplete = async (
  bridgeTransactionCompletePayload: BridgeStatusControllerBridgeTransactionCompleteEvent['payload'][0],
  metamaskState: any,
) => {
  console.log('handleBridgeTransactionComplete', {
    bridgeTransactionCompletePayload,
    metamaskState,
  });
};
