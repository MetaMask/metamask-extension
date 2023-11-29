import confirmReducer, { UPDATE_CURRENT_CONFIRMATION } from './confirm';

describe('App State', () => {
  const metamaskConfirmState = {
    currentConfirmation: undefined,
  };

  it('sets currentConfirmation', () => {
    const currentConfirmation = {
      id: '123',
    };
    const state = confirmReducer(metamaskConfirmState, {
      type: UPDATE_CURRENT_CONFIRMATION,
      currentConfirmation,
    });

    expect(state.currentConfirmation).toStrictEqual(currentConfirmation);
  });
});
