import type { PhishingController } from '@metamask/phishing-controller';
import { trace, TraceName } from '../../../shared/lib/trace';

type PhishingListsController = Pick<
  PhishingController,
  | 'isStalelistOutOfDate'
  | 'isHotlistOutOfDate'
  | 'isC2DomainBlocklistOutOfDate'
  | 'maybeUpdateState'
>;

const refreshInFlight = new WeakMap<PhishingListsController, Promise<void>>();

// Called with no caller at worker start, dapp connection and page request.
// Fresh lists, or a refresh already running, make no request and start no trace.
export function updatePhishingLists(
  phishingController: PhishingListsController,
): Promise<void> {
  const running = refreshInFlight.get(phishingController);
  if (running) {
    return running;
  }
  if (
    !phishingController.isStalelistOutOfDate() &&
    !phishingController.isHotlistOutOfDate() &&
    !phishingController.isC2DomainBlocklistOutOfDate()
  ) {
    return Promise.resolve();
  }
  const refresh = trace(
    { name: TraceName.PhishingListsUpdate, root: true },
    () => phishingController.maybeUpdateState(),
  ).finally(() => refreshInFlight.delete(phishingController));
  refreshInFlight.set(phishingController, refresh);
  return refresh;
}
