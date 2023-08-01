import { createAsyncMiddleware } from 'json-rpc-engine';
import { NetworkController } from '@metamask/network-controller';
import SelectedNetworkController from './selected-network-controller';

const createSelectedNetworkMiddleware = (
  selectedNetworkController: SelectedNetworkController,
  networkController: NetworkController,
) => {
  return createAsyncMiddleware(async (req: any, _, next) => {
    if (
      selectedNetworkController.getNetworkClientIdForDomain(req.origin) ===
      undefined
    ) {
      selectedNetworkController.setNetworkClientIdForDomain(
        req.origin,
        networkController.state.selectedNetworkClientId,
      );
    }

    const networkClientIdForRequest =
      selectedNetworkController.getNetworkClientIdForDomain(
        (req as any).origin,
      );

    req.networkClientId = networkClientIdForRequest;
    return next();
  });
};

export default createSelectedNetworkMiddleware;
