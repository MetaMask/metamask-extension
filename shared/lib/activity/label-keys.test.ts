import { getLabelKeys } from './label-keys';

describe('getLabels', () => {
  it('returns title and description keys', () => {
    expect(
      getLabelKeys({
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
