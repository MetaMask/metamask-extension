import { createSelector } from 'reselect';

export const selectFragments = (state) => state.metamask.fragments;

export const getIsSocialLoginFlowEnabledForMetrics = (state) =>
  state.metamask.isSocialLoginFlowEnabledForMetrics;

// return true if user has set their marketing consent preference or if they are a social login user
export const getDataCollectionForMarketing = (state) =>
  Boolean(getIsSocialLoginFlowEnabledForMetrics(state)) ||
  Boolean(state.metamask.dataCollectionForMarketing);

// return true if user has set their participation preference in MetaMetrics or if they are a social login user
export const getParticipateInMetaMetrics = (state) =>
  Boolean(getIsSocialLoginFlowEnabledForMetrics(state)) ||
  Boolean(state.metamask.participateInMetaMetrics);

// return true if user has set their participation preference in MetaMetrics or if they are a social login user
export const getIsParticipateInMetaMetricsSet = (state) =>
  Boolean(getIsSocialLoginFlowEnabledForMetrics(state)) ||
  state.metamask.participateInMetaMetrics !== null;

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
