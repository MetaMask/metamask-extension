type ActionType = {
  type: string;
  dummyValue?: string;
};

const createActionType = (action: string): string =>
  `metamask/confirm/${action}`;

const UPDATE_DUMMY = createActionType('UPDATE_DUMMY');

const initState = {
  dummy: undefined,
};

export default function confirmReducer(
  state = initState,
  action: ActionType = { type: '' },
) {
  switch (action.type) {
    case UPDATE_DUMMY:
      return {
        dummy: action.dummyValue,
      };
    default:
      return state;
  }
}

export function updateDummy(dummy: string) {
  return {
    type: UPDATE_DUMMY,
    dummy,
  };
}
