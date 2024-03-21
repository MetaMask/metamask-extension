type ActionType =
  | {
      type: 'metamask/confirm/UPDATE_CONFIRM';
      payload?: Record<string, unknown>;
    }
  | {
      type: 'metamask/confirm/UPDATE_CURRENT_CONFIRMATION';
      currentConfirmation?: Record<string, unknown> | undefined;
    };

const createActionType = (action: string): string =>
  `metamask/confirm/${action}`;

export const UPDATE_CONFIRM = createActionType('UPDATE_CONFIRM');
export const UPDATE_CURRENT_CONFIRMATION = createActionType(
  'UPDATE_CURRENT_CONFIRMATION',
);

const initState = {
  currentConfirmation: undefined,
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
    case 'metamask/confirm/UPDATE_CURRENT_CONFIRMATION': {
      return {
        ...state,
        currentConfirmation: action.currentConfirmation,
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

export function updateCurrentConfirmation(
  currentConfirmation: Record<string, unknown> | undefined,
) {
  return {
    type: UPDATE_CURRENT_CONFIRMATION,
    currentConfirmation,
  };
}
