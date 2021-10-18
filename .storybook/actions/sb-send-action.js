export const updateSendStatus = (status) => ({
  type: 'send/updateSendStatus',
  payload: status,
});

export const updateAmountMode = (mode) => ({
  type: 'send/updateAmountMode',
  payload: mode,
});

export const updateSendAsset = (type) => ({
  type: 'send/updateSendAsset',
  payload: type,
});

export const updateSendStage = (stage) => ({
  type: 'send/updateSendStage',
  payload: stage,
});

export const getSendAmount = () => ({
  type: 'send/getSendAmount',
});
