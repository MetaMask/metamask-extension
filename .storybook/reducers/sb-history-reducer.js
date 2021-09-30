import testData from '../test-data';

const initialState = { ...testData.history };
export default function historySBReducer(state = initialState, action) {
  switch (action.type) {
    default:
      return state;
  }
}
