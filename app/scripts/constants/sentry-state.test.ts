import { maskObject } from '../../../shared/modules/mask-object';
import backgroundStateFixture from './sentry-background-state-fixture';
import rootReduxStateFixture from './sentry-root-redux-state-fixture';
import { SENTRY_BACKGROUND_STATE, SENTRY_UI_STATE } from './sentry-state';

describe('SENTRY_BACKGROUND_STATE', () => {
  it('masks private data in background state', () => {
    const maskedState = maskObject(
      backgroundStateFixture,
      SENTRY_BACKGROUND_STATE,
    );

    expect(maskedState).toMatchSnapshot();
  });
});

describe('SENTRY_UI_STATE', () => {
  it('masks private data in UI state', () => {
    const maskedState = maskObject(rootReduxStateFixture, SENTRY_UI_STATE);

    expect(maskedState).toMatchSnapshot();
  });
});
