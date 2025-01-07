import { createSelector } from 'reselect';
import { MetaMaskSliceControllerState } from '../ducks/metamask/metamask';

type MetaMetricsMetaMaskState =
  MetaMaskSliceControllerState<'MetaMetricsController'>;

type Fragments =
  MetaMetricsMetaMaskState['metamask']['MetaMetricsController']['fragments'];

type FragmentOptions = Fragments[keyof Fragments];

export const selectFragments = (state: MetaMetricsMetaMaskState) =>
  state.metamask.MetaMetricsController.fragments;

export const getDataCollectionForMarketing = (
  state: MetaMetricsMetaMaskState,
) => state.metamask.MetaMetricsController.dataCollectionForMarketing;

export const getParticipateInMetaMetrics = (state: MetaMetricsMetaMaskState) =>
  Boolean(state.metamask.MetaMetricsController.participateInMetaMetrics);

export const getLatestMetricsEventTimestamp = (
  state: MetaMetricsMetaMaskState,
) => state.metamask.MetaMetricsController.latestNonAnonymousEventTimestamp;

export const selectFragmentBySuccessEvent = createSelector(
  selectFragments,
  (_: MetaMetricsMetaMaskState, fragmentOptions: FragmentOptions) =>
    fragmentOptions,
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
  (_: MetaMetricsMetaMaskState, fragmentId: string) => fragmentId,
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
  (
    state: MetaMetricsMetaMaskState,
    params: {
      fragmentOptions: FragmentOptions;
      existingId: string;
    },
  ) => selectFragmentBySuccessEvent(state, params.fragmentOptions),
  (state: MetaMetricsMetaMaskState, params) =>
    selectFragmentById(state, params.existingId),
  (matchedBySuccessEvent, matchedById) => matchedById ?? matchedBySuccessEvent,
);
