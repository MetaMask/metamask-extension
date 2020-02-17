import { getSendErrors } from '../send.selectors'

export function isSendFormInError (state) {
  return Object.values(getSendErrors(state)).some((n) => n)
}
