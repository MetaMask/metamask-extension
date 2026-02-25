const {
  selectFragmentBySuccessEvent,
  selectFragmentById,
  getLatestMetricsEventTimestamp,
} = require('.');

describe('selectFragmentBySuccessEvent', () => {
  it('should find matching fragment in state by successEvent', () => {
    const state = {
      metamask: {
        fragments: {
          randomid: {
            successEvent: 'example event',
            persist: true,
            id: 'randomid',
          },
        },
      },
    };
    const selected = selectFragmentBySuccessEvent(state, {
      successEvent: 'example event',
      persist: true,
    });
    expect(selected).toHaveProperty('id', 'randomid');
  });
});

describe('selectFragmentById', () => {
  it('should find matching fragment in state by id', () => {
    const state = {
      metamask: {
        fragments: {
          randomid: {
            successEvent: 'example event',
            persist: true,
            id: 'randomid',
          },
        },
      },
    };
    const selected = selectFragmentById(state, 'randomid');
    expect(selected).toHaveProperty('id', 'randomid');
  });
});

describe('getLatestMetricsEventTimestamp', () => {
  it('should find matching fragment in state by id', () => {
    const state = {
      metamask: {
        latestNonAnonymousEventTimestamp: 12345,
      },
    };
    const timestamp = getLatestMetricsEventTimestamp(state);
    expect(timestamp).toBe(12345);
  });
});
