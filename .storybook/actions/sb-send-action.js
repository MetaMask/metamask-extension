export const updateSendAsset = (type) => ({
  type: 'send/updateSendAsset',
  payload: type,
});

export const updateSendStage = (stage) => ({
  type: 'send/updateSendStage',
  payload: stage,
});
