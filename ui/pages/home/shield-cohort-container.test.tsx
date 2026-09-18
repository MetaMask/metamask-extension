import React from 'react';
import { act } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { COHORT_NAMES } from '@metamask/subscription-controller';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import { setPendingShieldCohort } from '../../store/actions';
import { ShieldCohortContainer } from './shield-cohort-container';

const mockEvaluateCohortEligibility = jest.fn();

jest.mock('../../contexts/shield/shield-subscription', () => ({
  useShieldSubscriptionContext: () => ({
    evaluateCohortEligibility: mockEvaluateCohortEligibility,
  }),
}));

jest.mock('../../store/actions', () => ({
  ...jest.requireActual('../../store/actions'),
  setPendingShieldCohort: jest.fn((cohort) => ({
    type: 'SET_PENDING_SHIELD_COHORT',
    payload: cohort,
  })),
}));

const mockStore = configureMockStore([thunk]);

function buildState({
  pendingShieldCohort = null,
  isSignedIn = false,
}: {
  pendingShieldCohort?: string | null;
  isSignedIn?: boolean;
} = {}) {
  return {
    metamask: {
      pendingShieldCohort,
      isSignedIn,
    },
    appState: {},
  };
}

function renderContainer(stateOverrides = {}) {
  const store = mockStore(buildState(stateOverrides));
  renderWithProvider(<ShieldCohortContainer />, store);
  return store;
}

describe('ShieldCohortContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('dispatches setPendingShieldCohort on mount when no cohort is set', () => {
    const store = renderContainer({ pendingShieldCohort: null });

    expect(setPendingShieldCohort).toHaveBeenCalledWith(
      COHORT_NAMES.WALLET_HOME,
    );
    expect(store.getActions()).toContainEqual(
      expect.objectContaining({ type: 'SET_PENDING_SHIELD_COHORT' }),
    );
  });

  it('does not dispatch setPendingShieldCohort when a cohort is already set', () => {
    renderContainer({ pendingShieldCohort: COHORT_NAMES.WALLET_HOME });

    expect(setPendingShieldCohort).not.toHaveBeenCalled();
  });

  it('does not evaluate cohort eligibility when the user is not signed in', () => {
    renderContainer({
      pendingShieldCohort: COHORT_NAMES.WALLET_HOME,
      isSignedIn: false,
    });

    expect(mockEvaluateCohortEligibility).not.toHaveBeenCalled();
  });

  it('evaluates cohort eligibility once when the user is signed in', () => {
    renderContainer({
      pendingShieldCohort: COHORT_NAMES.WALLET_HOME,
      isSignedIn: true,
    });

    expect(mockEvaluateCohortEligibility).toHaveBeenCalledTimes(1);
    expect(mockEvaluateCohortEligibility).toHaveBeenCalledWith(
      COHORT_NAMES.WALLET_HOME,
    );
  });

  it('does not re-evaluate if the component re-renders after evaluation', () => {
    const store = mockStore(
      buildState({
        pendingShieldCohort: COHORT_NAMES.WALLET_HOME,
        isSignedIn: true,
      }),
    );
    const { rerender } = renderWithProvider(<ShieldCohortContainer />, store);

    expect(mockEvaluateCohortEligibility).toHaveBeenCalledTimes(1);

    act(() => {
      rerender(<ShieldCohortContainer />);
    });

    expect(mockEvaluateCohortEligibility).toHaveBeenCalledTimes(1);
  });
});
