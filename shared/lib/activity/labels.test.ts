import { getLabels } from './labels';

describe('getLabels', () => {
  it('returns title and description keys', () => {
    expect(
      getLabels({
        type: 'swap',
        status: 'pending',
      }),
    ).toStrictEqual({
      title: {
        key: 'activity_swap_pending_title',
      },
      description: {
        key: 'activity_swap_pending_description',
      },
    });
  });
});
