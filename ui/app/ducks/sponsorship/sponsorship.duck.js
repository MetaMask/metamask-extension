const SET_SPONSORSHIP_INFO = 'metamask/sponsorship/SET_SPONSORSHIP_INFO'
const RESET_SPONSORSHIP_INFO = 'metamask/sponsorship/RESET_SPONSORSHIP_INFO'

// state.sponsorship
const initState = {
  willUserPayGas: true,
  willUserPayStorage: true,
  isUserBalanceEnough: false,
}

export default function reducer (state = initState, action) {
  switch (action.type) {
    case SET_SPONSORSHIP_INFO:
      return action.value
    case RESET_SPONSORSHIP_INFO:
      return initState
    default:
      return state
  }
}

export function setCustomSponsorshipInfo ({
  isUserBalanceEnough,
  willUserPayCollateral,
  willUserPayTxFee,
}) {
  return {
    type: SET_SPONSORSHIP_INFO,
    value: {
      isUserBalanceEnough: isUserBalanceEnough,
      willUserPayStorage: willUserPayCollateral,
      willUserPayGas: willUserPayTxFee,
    },
  }
}

export function resetCustomSponsorshipInfo () {
  return { type: RESET_SPONSORSHIP_INFO }
}
