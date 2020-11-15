import { getSendErrors } from '../send.selectors'

export function isSendFormInError(state, advancedInlineGasShown) {
  const sendErrors = { ...getSendErrors(state) }

  // when advancedInlineGasShown is false, there's no gas ui in send component,
  // so we shouldn't check gas here
  if (!advancedInlineGasShown) {
    sendErrors.gasAndCollateralFee = null
  }
  return Object.values(sendErrors).some(n => n)
}
