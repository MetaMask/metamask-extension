export type SampleGlobalState = {
  counter: number;
};

type UpdateSampleCounterAction = {
  type: 'UPDATE_SAMPLE_COUNTER';
  amount: number;
};

type Action = UpdateSampleCounterAction;

const INIT_STATE: SampleGlobalState = {
  counter: 0,
};

export default function sampleReducer(
  // eslint-disable-next-line @typescript-eslint/default-param-last
  state: SampleGlobalState = INIT_STATE,
  action: Action,
) {
  switch (action.type) {
    case 'UPDATE_SAMPLE_COUNTER':
      return {
        ...state,
        counter: state.counter + action.amount,
      };

    default:
      return state;
  }
}

export function updateSampleCounter(amount: number): UpdateSampleCounterAction {
  return {
    type: 'UPDATE_SAMPLE_COUNTER',
    amount,
  };
}
