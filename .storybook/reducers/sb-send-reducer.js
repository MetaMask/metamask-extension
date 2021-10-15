import testData from '../test-data';

const initialState = { ...testData.send };

export default function sendSBReducer(state = initialState, action) {
  switch (action.type) {
    case 'send/updateSendStatus':
      return {
        ...state,
        status: action.payload,
      };
    case 'send/updateAmountMode':
      return {
        ...state,
        amount: { ...state.amount, mode: action.payload },
      };
    case 'send/updateSendStage':
      return {
        ...state,
        stage: action.payload,
      };
    case 'send/updateSendAsset':
      return {
        ...state,
        asset: { ...state.asset, type: action.payload },
      };
    case 'send/getSendAmount':
      return state.amount;
    default:
      return state;
  }
}
