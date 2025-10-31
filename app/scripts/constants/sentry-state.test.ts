import { merge } from 'lodash';
import { maskObject } from '../../../shared/modules/mask-object';
import onboardingFixture from '../../../test/e2e/fixtures/onboarding-fixture.json';
import { SENTRY_BACKGROUND_STATE, SENTRY_UI_STATE } from './sentry-state';

const mockAppState = merge(onboardingFixture.data, {
  // ... okay
});

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
