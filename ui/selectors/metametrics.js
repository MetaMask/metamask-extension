import { createSelector } from 'reselect';

const selectFragments = (state) => state.metamask.fragments;

// return true if user has set their marketing consent preference or if they are a social login user
export const getDataCollectionForMarketing = (state) =>
  state.metamask.dataCollectionForMarketing;

// return the user's MetaMetrics participation preference
export const getParticipateInMetaMetrics = (state) => {
  if (state.metamask.completedMetaMetricsOnboarding !== true) {
    return null;
  }
  return state.metamask.optedIn === true;
};

// return true once the user has completed the metrics participation prompt (yes or no)
export const getIsParticipateInMetaMetricsSet = (state) =>
  state.metamask.completedMetaMetricsOnboarding === true;

export const getPna25Acknowledged = (state) => state.metamask.pna25Acknowledged;

export const getLatestMetricsEventTimestamp = (state) =>
  state.metamask.latestNonAnonymousEventTimestamp;

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
