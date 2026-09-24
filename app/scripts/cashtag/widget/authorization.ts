const tokenPattern = /^[0-9a-f]{64}$/u;
const pendingLifetimeMs = 15_000;
const widgetFramePath = 'cashtag-widget.html';
const xHosts = new Set(['x.com', 'www.x.com']);

type Session = {
  token: string;
  tabId: number;
  parentDocumentId?: string;
  frameId?: number;
  documentId?: string;
  expiresAt?: number;
};

function isXTopFrame(sender: chrome.runtime.MessageSender) {
  try {
    const url = new URL(sender.url ?? '');
    return (
      sender.id === chrome.runtime.id &&
      sender.frameId === 0 &&
      typeof sender.tab?.id === 'number' &&
      url.protocol === 'https:' &&
      xHosts.has(url.hostname)
    );
  } catch {
    return false;
  }
}

function isWidgetFrame(sender: chrome.runtime.MessageSender) {
  try {
    const url = new URL(sender.url ?? '');
    const tabUrl = new URL(sender.tab?.url ?? '');
    const expected = new URL(chrome.runtime.getURL(widgetFramePath));
    return (
      sender.id === chrome.runtime.id &&
      typeof sender.tab?.id === 'number' &&
      typeof sender.frameId === 'number' &&
      sender.frameId > 0 &&
      url.protocol === expected.protocol &&
      url.hostname === expected.hostname &&
      url.pathname === expected.pathname &&
      url.search === '' &&
      url.hash === '' &&
      tabUrl.protocol === 'https:' &&
      xHosts.has(tabUrl.hostname)
    );
  } catch {
    return false;
  }
}

/**
 * Tracks the single widget frame authorized by each X tab.
 * @param now
 */
export function createWidgetFrameAuthorization(now = Date.now) {
  const sessions = new Map<number, Session>();

  function register(token: unknown, sender: chrome.runtime.MessageSender) {
    if (
      !isXTopFrame(sender) ||
      typeof token !== 'string' ||
      !tokenPattern.test(token)
    ) {
      return false;
    }

    const tabId = sender.tab?.id;
    if (tabId === undefined) {
      return false;
    }
    sessions.set(tabId, {
      token,
      tabId,
      parentDocumentId: sender.documentId,
      expiresAt: now() + pendingLifetimeMs,
    });
    return true;
  }

  function claim(token: unknown, sender: chrome.runtime.MessageSender) {
    if (!isWidgetFrame(sender) || typeof token !== 'string') {
      return false;
    }
    const tabId = sender.tab?.id;
    const session = tabId === undefined ? undefined : sessions.get(tabId);
    if (
      !session ||
      session.token !== token ||
      session.frameId !== undefined ||
      (session.expiresAt ?? 0) < now()
    ) {
      return false;
    }

    session.frameId = sender.frameId;
    session.documentId = sender.documentId;
    delete session.expiresAt;
    return true;
  }

  function isAuthorized(token: unknown, sender: chrome.runtime.MessageSender) {
    if (!isWidgetFrame(sender) || typeof token !== 'string') {
      return false;
    }
    const tabId = sender.tab?.id;
    const session = tabId === undefined ? undefined : sessions.get(tabId);
    return Boolean(
      session &&
      session.token === token &&
      session.frameId === sender.frameId &&
      session.frameId !== undefined &&
      (!session.documentId || session.documentId === sender.documentId),
    );
  }

  function revoke(token: unknown, sender: chrome.runtime.MessageSender) {
    if (!isXTopFrame(sender) || typeof token !== 'string') {
      return false;
    }
    const tabId = sender.tab?.id;
    const session = tabId === undefined ? undefined : sessions.get(tabId);
    if (
      !session ||
      session.token !== token ||
      (session.parentDocumentId &&
        session.parentDocumentId !== sender.documentId)
    ) {
      return false;
    }
    sessions.delete(session.tabId);
    return true;
  }

  function removeTab(tabId: number) {
    sessions.delete(tabId);
  }

  return { register, claim, isAuthorized, revoke, removeTab };
}

export type WidgetFrameAuthorization = ReturnType<
  typeof createWidgetFrameAuthorization
>;
