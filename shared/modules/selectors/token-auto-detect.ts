import { getUseTokenDetection } from '../../../ui/selectors/selectors';

type TokenAutoDetectionMetaMaskState = {
  metamask: {
    preferences: {
      showTokenAutodetectModal: boolean | null;
    };
    showTokenAutodetectModalOnUpgrade: boolean | null;
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
  // Upgrade case
  if (state.metamask.showTokenAutodetectModalOnUpgrade === null) {
    return (
      !getUseTokenDetection(state) &&
      state.metamask.showTokenAutodetectModalOnUpgrade === null
    );
  }

  return (
    !getUseTokenDetection(state) && getShowTokenAutodetectModal(state) === null
  );
};
