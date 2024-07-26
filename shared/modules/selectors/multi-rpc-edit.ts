import { getUseTokenDetection } from '../../../ui/selectors/selectors';

type MultiRpcEditMetaMaskState = {
  metamask: {
    preferences: {
      showMultiRpcModal: boolean | null;
      showMultiRpcModalUpgrade: boolean | null;
    };
  };
};

export const getIsShowMultiRpcModal = (state: MultiRpcEditMetaMaskState) => {
  return (
    state.metamask.preferences?.showMultiRpcModal === null ||
    state.metamask.showMultiRpcModalUpgrade === null
  );
};
