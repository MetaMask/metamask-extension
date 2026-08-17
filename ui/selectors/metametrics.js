import { createSelector } from 'reselect';

const selectFragments = (state) => state.metamask.fragments;

// return true if user has set their marketing consent preference or if they are a social login user
export const getDataCollectionForMarketing = (state) =>
  state.metamask.dataCollectionForMarketing;

// return whether the user has opted in to analytics (AnalyticsController.optedIn)
export const getOptedIn = (state) => state.metamask.optedIn === true;

// return true once the user has completed the metrics participation prompt (yes or no)
// Backed by AnalyticsController.consentDecisionMade.
export const getCompletedMetaMetricsOnboarding = (state) =>
  state.metamask.consentDecisionMade === true;

export const getPna25Acknowledged = (state) => state.metamask.pna25Acknowledged;

export const selectFragmentBySuccessEvent = createSelector(
  selectFragments,
  (_, fragmentOptions) => fragmentOptions,
  (fragments, fragmentOptions) => {
    if (fragmentOptions.persist) {
      return Object.values(fragments).find(
        (fragment) => fragment.successEvent === fragmentOptions.successEvent,
      );
    }
    return undefined;
  },
);

export const selectFragmentById = createSelector(
  selectFragments,
  (_, fragmentId) => fragmentId,
  (fragments, fragmentId) => {
    // A valid existing fragment must exist in state.
    // If these conditions are not meant we will create a new fragment.
    if (fragmentId && fragments?.[fragmentId]) {
      return fragments[fragmentId];
    }
    return undefined;
  },
);

export const selectMatchingFragment = createSelector(
  (state, params) =>
    selectFragmentBySuccessEvent(state, params.fragmentOptions),
  (state, params) => selectFragmentById(state, params.existingId),
  (matchedBySuccessEvent, matchedById) => matchedById ?? matchedBySuccessEvent,
);
