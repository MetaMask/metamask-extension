type ActionType = {
  type: 'metamask/confirm/UPDATE_CONFIRM';
  payload?: Record<string, unknown>;
};

const createActionType = (action: string): string =>
  `metamask/confirm/${action}`;

export const UPDATE_CONFIRM = createActionType('UPDATE_CONFIRM');

const initState = {
  isScrollToBottomCompleted: true,
};

export default function confirmReducer(
  // eslint-disable-next-line @typescript-eslint/default-param-last
  state: typeof initState = initState,
  action: ActionType,
) {
  switch (action.type) {
    case 'metamask/confirm/UPDATE_CONFIRM': {
      return {
        ...state,
        ...action.payload,
      };
    }
    default:
      return state;
  }
}

export function updateConfirm(payload: Record<string, unknown> | undefined) {
  return {
    type: UPDATE_CONFIRM,
    payload: payload || initState,
  };
}
