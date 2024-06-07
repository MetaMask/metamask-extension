import { getUseNftDetection } from '../../../ui/selectors/selectors';

type NftAutoDetectionMetaMaskState = {
  metamask: {
    preferences: {
      showNftAutodetectModal: boolean | null;
    };
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
  return (
    !getUseNftDetection(state) &&
    (getShowNftAutodetectModal(state) === null ||
      getShowNftAutodetectModal(state) === undefined)
  );
};
