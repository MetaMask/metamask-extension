import { TraceName } from '../../../shared/lib/trace';
import {
  readActiveSpan,
  startServiceWorkerSentry,
  stopServiceWorkerSentry,
} from '../../../test/lib/service-worker-sentry';
import { updatePhishingLists } from './update-phishing-lists';

function buildPhishingController(outOfDate: boolean) {
  const seen: ReturnType<typeof readActiveSpan>[] = [];
  return {
    seen,
    controller: {
      isStalelistOutOfDate: () => false,
      isHotlistOutOfDate: () => outOfDate,
      isC2DomainBlocklistOutOfDate: () => false,
      maybeUpdateState: jest.fn(async () => {
        seen.push(readActiveSpan());
      }),
    },
  };
}

describe('updatePhishingLists (real SDK)', () => {
  afterEach(() => {
    stopServiceWorkerSentry();
  });

  it('refreshes out-of-date lists under their own root trace', async () => {
    const ambientTraceId = startServiceWorkerSentry();
    const { controller, seen } = buildPhishingController(true);

    await updatePhishingLists(controller);

    expect(seen).toStrictEqual([
      { traceId: expect.any(String), rootName: TraceName.PhishingListsUpdate },
    ]);
    expect(seen[0]?.traceId).not.toBe(ambientTraceId);
  });

  it('starts no trace and makes no request when the lists are fresh', async () => {
    startServiceWorkerSentry();
    const { controller } = buildPhishingController(false);

    await updatePhishingLists(controller);

    expect(controller.maybeUpdateState).not.toHaveBeenCalled();
  });

  it('joins a refresh that is already running', async () => {
    startServiceWorkerSentry();
    const { controller } = buildPhishingController(true);

    await Promise.all([
      updatePhishingLists(controller),
      updatePhishingLists(controller),
    ]);

    expect(controller.maybeUpdateState).toHaveBeenCalledTimes(1);
  });
});
