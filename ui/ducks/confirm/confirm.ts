type ActionType = {
  type: string;
  currentConfirmation?: Record<string, unknown> | undefined;
};

const createActionType = (action: string): string =>
  `metamask/confirm/${action}`;

export const UPDATE_CURRENT_CONFIRMATION = createActionType(
  'UPDATE_CURRENT_CONFIRMATION',
);

const initState = {
  currentConfirmation: undefined,
};

export default function confirmReducer(
  state = initState,
  action: ActionType = { type: '' },
) {
  switch (action.type) {
    case UPDATE_CURRENT_CONFIRMATION:
      return {
        currentConfirmation: action.currentConfirmation,
      };
    default:
      return state;
  }
}

export function updateCurrentConfirmation(
  currentConfirmation: Record<string, unknown> | undefined,
) {
  return {
    type: UPDATE_CURRENT_CONFIRMATION,
    currentConfirmation,
  };
}
