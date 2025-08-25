import { useCallback } from 'react';
import * as URI from 'uri-js';
import { RpcEndpointType } from '@metamask/network-controller';
import { useNetworkFormState } from '../../../../pages/settings/networks-tab/networks-form/networks-form-state';

type UseNewRPCProps = {
  rpcUrls: ReturnType<typeof useNetworkFormState>['rpcUrls'];
  setRpcUrls: ReturnType<typeof useNetworkFormState>['setRpcUrls'];
  onComplete?: () => void;
};

export const useNewRPC = ({
  rpcUrls,
  setRpcUrls,
  onComplete,
}: UseNewRPCProps) => {
  const handleAddRPC = useCallback(
    (url: string, name: string) => {
      // Note: We could choose to rename the URL if it already exists with a different name
      if (rpcUrls.rpcEndpoints?.every((e) => !URI.equal(e.url, url))) {
        setRpcUrls({
          rpcEndpoints: [
            ...rpcUrls.rpcEndpoints,
            { url, name, type: RpcEndpointType.Custom },
          ],
          defaultRpcEndpointIndex: rpcUrls.rpcEndpoints.length,
        });
      }

      // Execute the completion callback if provided
      onComplete?.();
    },
    [rpcUrls, setRpcUrls, onComplete],
  );

  return {
    handleAddRPC,
    rpcUrls,
  };
};
