import { UPDATE_METAMASK_STATE } from '../store/actionConstants';
import rootReducer from '.';

describe('rootReducer', () => {
  it('preserves background swaps controller updates', () => {
    const swapsState = { tokens: [] };

    const state = rootReducer(undefined, {
      type: UPDATE_METAMASK_STATE,
      value: { swapsState },
    });

    expect(state.metamask).toHaveProperty('swapsState', swapsState);
  });
});
