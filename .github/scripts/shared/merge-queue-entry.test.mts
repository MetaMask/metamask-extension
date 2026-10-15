import {
  verifyMergeQueueEntry,
  verifyMergeQueueRetry,
} from './merge-queue-entry.mts';

describe('verifyMergeQueueEntry', () => {
  it('returns current when the queue entry matches the failed run SHA', async () => {
    const result = await verifyMergeQueueEntry({
      expectedHeadSha: 'current-sha',
      getHeadSha: async () => 'current-sha',
      sleep: async () => undefined,
    });

    expect(result).toStrictEqual({
      state: 'current',
      headSha: 'current-sha',
    });
  });

  it('returns stale when the queue entry is missing', async () => {
    const result = await verifyMergeQueueEntry({
      expectedHeadSha: 'current-sha',
      getHeadSha: async () => null,
      sleep: async () => undefined,
    });

    expect(result).toStrictEqual({ state: 'stale' });
  });

  it('returns stale when the queue entry points to another SHA', async () => {
    const result = await verifyMergeQueueEntry({
      expectedHeadSha: 'current-sha',
      getHeadSha: async () => 'replacement-sha',
      sleep: async () => undefined,
    });

    expect(result).toStrictEqual({
      state: 'stale',
      headSha: 'replacement-sha',
    });
  });

  it('retries an API failure before returning the current entry', async () => {
    let calls = 0;
    const delays: number[] = [];
    const result = await verifyMergeQueueEntry({
      expectedHeadSha: 'current-sha',
      getHeadSha: async () => {
        calls += 1;
        if (calls < 3) {
          throw new Error('GitHub API unavailable');
        }
        return 'current-sha';
      },
      sleep: async (milliseconds) => {
        delays.push(milliseconds);
      },
    });

    expect(result).toStrictEqual({
      state: 'current',
      headSha: 'current-sha',
    });
    expect(delays).toStrictEqual([1000, 2000]);
  });

  it('returns unverified after exhausting API retries', async () => {
    let calls = 0;
    const result = await verifyMergeQueueEntry({
      expectedHeadSha: 'current-sha',
      getHeadSha: async () => {
        calls += 1;
        throw new Error('GitHub API unavailable');
      },
      sleep: async () => undefined,
    });

    expect(result).toStrictEqual({ state: 'unverified' });
    expect(calls).toBe(3);
  });
});

describe('verifyMergeQueueRetry', () => {
  it('returns stale when the queue ref disappears after entry verification', async () => {
    const result = await verifyMergeQueueRetry({
      expectedHeadSha: 'current-sha',
      getHeadSha: async () => 'current-sha',
      refExists: async () => false,
      sleep: async () => undefined,
    });

    expect(result).toStrictEqual({
      state: 'stale',
      headSha: 'current-sha',
    });
  });

  it('returns unverified when the queue ref cannot be checked', async () => {
    const result = await verifyMergeQueueRetry({
      expectedHeadSha: 'current-sha',
      getHeadSha: async () => 'current-sha',
      refExists: async () => {
        throw new Error('GitHub API unavailable');
      },
      sleep: async () => undefined,
    });

    expect(result).toStrictEqual({
      state: 'unverified',
      headSha: 'current-sha',
    });
  });

  it('does not check the queue ref when the entry is stale', async () => {
    let refChecks = 0;
    const result = await verifyMergeQueueRetry({
      expectedHeadSha: 'current-sha',
      getHeadSha: async () => 'replacement-sha',
      refExists: async () => {
        refChecks += 1;
        return true;
      },
      sleep: async () => undefined,
    });

    expect(result).toStrictEqual({
      state: 'stale',
      headSha: 'replacement-sha',
    });
    expect(refChecks).toBe(0);
  });
});
