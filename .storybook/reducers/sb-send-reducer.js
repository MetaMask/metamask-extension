import testData from '../test-data';

const initialState = { send: testData.send };
export default function sendSBReducer(state = initialState, action) {
  switch (action.type) {
    case 'send/updateSendStatus':
      return {
        ...state,
        send: { ...state.send, status: action.payload },
      };
    case 'send/updateAmountMode':
      return {
        ...state,
        send: {
          ...state.send,
          amount: { ...state.send.amount, mode: action.payload },
        },
      };
    default:
      return state;
  }
}
