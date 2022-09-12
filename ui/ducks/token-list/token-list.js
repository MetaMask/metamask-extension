export default function tokenListReducer(state = {}) {
  const tokenListState = {
    tokenList: {},
    ...state,
  };

  return tokenListState;
}
