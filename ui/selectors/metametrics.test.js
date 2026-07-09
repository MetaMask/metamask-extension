const {
  selectFragmentBySuccessEvent,
  selectFragmentById,
  selectMatchingFragment,
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

describe('selectMatchingFragment', () => {
  it('should find matching fragment in state by id', () => {
    const state = {
      metamask: {
        fragments: {
          notthecorrectid: {
            successEvent: 'event name',
            id: 'notthecorrectid',
          },
          randomid: {
            successEvent: 'example event',
            persist: true,
            id: 'randomid',
          },
        },
      },
    };
    const selected = selectMatchingFragment(state, {
      fragmentOptions: {
        successEvent: 'event name',
      },
      existingId: 'randomid',
    });
    expect(selected).toHaveProperty('id', 'randomid');
  });
});
