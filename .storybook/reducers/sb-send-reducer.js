import testData from '../test-data';

const initialState = { ...testData.send };
export default function sendSBReducer(state = initialState, action) {
  switch (action.type) {
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
    default:
      return state;
  }
}
