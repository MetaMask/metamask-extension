import type { MetaMetricsEventFragment } from '../../shared/constants/metametrics';
import {
  getCompletedMetaMetricsOnboarding,
  getOptedIn,
  type MetaMetricsState,
  selectFragmentById,
  selectFragmentBySuccessEvent,
  selectMatchingFragment,
} from './metametrics';

const state = (
  metamask: Partial<MetaMetricsState['metamask']>,
): MetaMetricsState => ({
  metamask: {
    fragments: {},
    dataCollectionForMarketing: null,
    ...metamask,
  },
});

describe('MetaMetrics selectors', () => {
  it('returns whether the user has opted in to analytics', () => {
    expect(getOptedIn(state({ optedIn: true }))).toBe(true);
    expect(getOptedIn(state({ optedIn: false }))).toBe(false);
  });

  it('returns whether metrics onboarding has been completed', () => {
    expect(
      getCompletedMetaMetricsOnboarding(
        state({ completedMetaMetricsOnboarding: true }),
      ),
    ).toBe(true);
    expect(
      getCompletedMetaMetricsOnboarding(
        state({ completedMetaMetricsOnboarding: false }),
      ),
    ).toBe(false);
  });
});

describe('selectFragmentBySuccessEvent', () => {
  it('finds matching fragment in state by successEvent', () => {
    const selected = selectFragmentBySuccessEvent(
      state({
        fragments: {
          randomid: {
            successEvent: 'example event',
            persist: true,
            id: 'randomid',
          } as MetaMetricsEventFragment,
        },
      }),
      {
        successEvent: 'example event',
        persist: true,
      },
    );

    expect(selected).toHaveProperty('id', 'randomid');
  });
});

describe('selectFragmentById', () => {
  it('finds matching fragment in state by id', () => {
    const selected = selectFragmentById(
      state({
        fragments: {
          randomid: {
            successEvent: 'example event',
            persist: true,
            id: 'randomid',
          } as MetaMetricsEventFragment,
        },
      }),
      'randomid',
    );

    expect(selected).toHaveProperty('id', 'randomid');
  });
});

describe('selectMatchingFragment', () => {
  it('finds matching fragment in state by id', () => {
    const selected = selectMatchingFragment(
      state({
        fragments: {
          notthecorrectid: {
            successEvent: 'event name',
            id: 'notthecorrectid',
          } as MetaMetricsEventFragment,
          randomid: {
            successEvent: 'example event',
            persist: true,
            id: 'randomid',
          } as MetaMetricsEventFragment,
        },
      }),
      {
        fragmentOptions: {
          successEvent: 'event name',
        },
        existingId: 'randomid',
      },
    );

    expect(selected).toHaveProperty('id', 'randomid');
  });
});
