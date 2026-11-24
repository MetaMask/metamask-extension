import {
  C2_DOMAIN_BLOCKLIST_URL,
  METAMASK_HOTLIST_DIFF_URL,
  METAMASK_STALELIST_URL,
  type PhishingController,
} from '@metamask/phishing-controller';
import { TraceName } from '../../../shared/lib/trace';
import { runAsOwnRootClaiming } from './own-root-trace';

type PhishingListsController = Pick<
  PhishingController,
  | 'isStalelistOutOfDate'
  | 'isHotlistOutOfDate'
  | 'isC2DomainBlocklistOutOfDate'
  | 'maybeUpdateState'
>;

const refreshInFlight = new WeakMap<PhishingListsController, Promise<void>>();

const PHISHING_LIST_URLS = [
  METAMASK_STALELIST_URL,
  METAMASK_HOTLIST_DIFF_URL,
  C2_DOMAIN_BLOCKLIST_URL,
];

function isPhishingListUrl(url: string): boolean {
  return PHISHING_LIST_URLS.some((listUrl) => url.startsWith(listUrl));
}

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
  // The controller sends its diff and blocklist requests with the global
  // `fetch`, after awaiting the first.
  const refresh = runAsOwnRootClaiming(
    TraceName.PhishingListsUpdate,
    isPhishingListUrl,
    () => phishingController.maybeUpdateState(),
  ).finally(() => refreshInFlight.delete(phishingController));
  refreshInFlight.set(phishingController, refresh);
  return refresh;
}
