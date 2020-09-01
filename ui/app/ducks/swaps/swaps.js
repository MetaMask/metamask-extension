// Actions
const SET_SWAPS_FROM_TOKEN = 'metamask/swaps/SET_SWAPS_FROM_TOKEN'
const CLEAR_SWAPS_STATE = 'metamask/swaps/CLEAR_SWAPS_STATE'

const emptyState = {
  fromToken: null,
}

export default function reduceSwaps (state = {}, action) {
  const swapsState = { ...emptyState, ...state }

  switch (action.type) {

    case SET_SWAPS_FROM_TOKEN:
      return {
        ...swapsState,
        fromToken: action.value,
      }

    case CLEAR_SWAPS_STATE:
      return {
        ...emptyState,
      }

    default:
      return swapsState
  }
}

export function setSwapsFromToken (token) {
  return {
    type: SET_SWAPS_FROM_TOKEN,
    value: token,
  }
}

export function clearSwapsState () {
  return {
    type: CLEAR_SWAPS_STATE,
  }
}

export const getSwapsFromToken = (state) => state.swaps.fromToken

export const getSwapsWelcomeMessageSeenStatus = (state) => state.metamask.swapsWelcomeMessageHasBeenShown
