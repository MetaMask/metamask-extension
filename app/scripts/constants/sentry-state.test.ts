import { maskObject } from '../../../shared/modules/mask-object';
import sentryStateTestFixture from './sentry-state-test-fixture.json';
import { SENTRY_BACKGROUND_STATE, SENTRY_UI_STATE } from './sentry-state';

const mockAppState = sentryStateTestFixture;

describe('SENTRY_BACKGROUND_STATE', () => {
  it('masks private data in background state', () => {
    const maskedState = maskObject(mockAppState, SENTRY_BACKGROUND_STATE);

    expect(maskedState).toMatchSnapshot();
  });
});

describe('SENTRY_UI_STATE', () => {
  it('masks private data in UI state', () => {
    const maskedState = maskObject(mockAppState, SENTRY_UI_STATE);

    expect(maskedState).toMatchSnapshot();
  });
});
