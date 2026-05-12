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
        key: 'activity.swap.pending.title',
        substitutions,
      },
      description: {
        key: 'activity.swap.pending.description',
        substitutions,
      },
    });
  });
});
