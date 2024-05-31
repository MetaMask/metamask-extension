import { getUseNftDetection } from '../../../ui/selectors/selectors';

type NftAutoDetectionMetaMaskState = {
  metamask: {
    preferences: {
      showNftAutodetectModal: boolean | null;
    };
    showNftAutodetectModalOnUpgrade: boolean | null;
  };
};

export const getShowNftAutodetectModal = (
  state: NftAutoDetectionMetaMaskState,
): boolean | null => {
  return state.metamask.preferences?.showNftAutodetectModal;
};

export const getIsShowNftAutodetectModal = (
  state: NftAutoDetectionMetaMaskState,
) => {
  // Upgrade case
  if (state.metamask.showNftAutodetectModalOnUpgrade === null) {
    return (
      !getUseNftDetection(state) &&
      state.metamask.showNftAutodetectModalOnUpgrade === null
    );
  }

  return (
    !getUseNftDetection(state) && getShowNftAutodetectModal(state) === null
  );
};
