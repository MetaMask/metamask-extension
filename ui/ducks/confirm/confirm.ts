type ActionType = {
  type: string;
  propsToUpdate?: Record<string, unknown> | undefined;
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
  action: ActionType = { type: '', propsToUpdate: {} },
) {
  switch (action.type) {
    case UPDATE_CURRENT_CONFIRMATION: {
      const currentConfirmation = state.currentConfirmation || {};

      return {
        currentConfirmation: {
          ...currentConfirmation,
          ...action.propsToUpdate,
        },
      };
    }
    default:
      return state;
  }
}

export function updateCurrentConfirmation(
  propsToUpdate: Record<string, unknown> | undefined,
) {
  return {
    type: UPDATE_CURRENT_CONFIRMATION,
    propsToUpdate,
  };
}
