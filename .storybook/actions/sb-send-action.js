export const updateSendStatus = (status) => ({
  type: 'send/updateSendStatus',
  payload: status,
});

export const updateAmountMode = (mode) => ({
  type: 'send/updateAmountMode',
  payload: mode,
});
