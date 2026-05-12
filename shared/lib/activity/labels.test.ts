import { getLabels } from './labels';

describe('getLabels', () => {
  it('returns title and description keys with substitutions', () => {
    const substitutions = ['ETH', 'DAI'];

    expect(
      getLabels({
        type: 'swap',
        status: 'pending',
        substitutions,
      }),
    ).toStrictEqual({
      title: {
        key: 'activity_swap_pending_title',
        substitutions,
      },
      description: {
        key: 'activity_swap_pending_description',
        substitutions,
      },
    });
  });
});
