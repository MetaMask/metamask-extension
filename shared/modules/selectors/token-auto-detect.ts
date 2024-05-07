import { getUseTokenDetection } from '../../../ui/selectors/selectors';

type TokenAutoDetectionMetaMaskState = {
  metamask: {
    preferences: {
      showTokenAutodetectModal: boolean | null;
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
