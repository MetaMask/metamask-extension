type MultiRpcEditMetaMaskState = {
  metamask: {
    preferences: {
      showMultiRpcModal: boolean | null;
    };
  };
};

export const getIsShowMultiRpcModal = (state: MultiRpcEditMetaMaskState) => {
  const { preferences } = state.metamask;

  return (
    preferences?.showMultiRpcModal === null ||
    preferences?.showMultiRpcModal === undefined
  );
};
