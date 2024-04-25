import type { Hex } from '@metamask/utils';
import { getUseTokenDetection } from '../../../ui/selectors/selectors'; // TODO: Migrate shared selectors to this file.

type TokenAutoDetectionMetaMaskState = {
  metamask: {
    preferences: {
      showTokenAutodetectModal: boolean | null;
    };

    providerConfig: {
      chainId: Hex;
    };
    networkConfigurations: {
      [key: string]: {
        chainId: Hex;
        rpcUrl: string;
      };
    };
  };
};

export const getShowTokenAutodetectModal = (
  state: TokenAutoDetectionMetaMaskState,
): boolean | null => {
  return state.metamask.preferences?.showTokenAutodetectModal;
};

export const getIsShowTokenAutodetectModal = (
  state: TokenAutoDetectionMetaMaskState,
) => {
  return (
    !getUseTokenDetection(state) && getShowTokenAutodetectModal(state) === null
  );
};
