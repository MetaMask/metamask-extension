import {
  getWidgetPageUrl,
  isAllowedWidgetOrigin,
  isWidgetId,
  type WidgetId,
} from './protocol';

const tokenPattern = /^[0-9a-f]{64}$/u;
const pendingLifetimeMs = 15_000;
const maxSessionsPerTab = 32;

type Session = {
  widgetId: WidgetId;
  token: string;
  tabId: number;
  parentOrigin: string;
  parentDocumentId?: string;
  frameId?: number;
  documentId?: string;
  expiresAt?: number;
};

function senderOrigin(sender: chrome.runtime.MessageSender) {
  try {
    return new URL(sender.url ?? '').origin;
  } catch {
    return null;
  }
}

function isParentSender(
  widgetId: WidgetId,
  sender: chrome.runtime.MessageSender,
) {
  const origin = senderOrigin(sender);
  return (
    sender.id === chrome.runtime.id &&
    sender.frameId === 0 &&
    typeof sender.tab?.id === 'number' &&
    origin !== null &&
    isAllowedWidgetOrigin(widgetId, origin)
  );
}

function isWidgetFrame(sender: chrome.runtime.MessageSender) {
  try {
    const url = new URL(sender.url ?? '');
    const expected = new URL(getWidgetPageUrl());
    return (
      sender.id === chrome.runtime.id &&
      typeof sender.tab?.id === 'number' &&
      typeof sender.frameId === 'number' &&
      sender.frameId > 0 &&
      url.protocol === expected.protocol &&
      url.host === expected.host &&
      url.pathname === expected.pathname &&
      url.search === '' &&
      url.hash === ''
    );
  } catch {
    return false;
  }
}

/**
 * Tracks independent, single-use widget frame registrations across tabs.
 * @param now
 */
export function createWidgetFrameAuthorization(now = Date.now) {
  const sessions = new Map<string, Session>();

  function register(
    widgetId: unknown,
    token: unknown,
    sender: chrome.runtime.MessageSender,
  ) {
    if (
      !isWidgetId(widgetId) ||
      !isParentSender(widgetId, sender) ||
      typeof token !== 'string' ||
      !tokenPattern.test(token) ||
      sessions.has(token)
    ) {
      return false;
    }
    const tabId = sender.tab?.id;
    const parentOrigin = senderOrigin(sender);
    if (tabId === undefined || parentOrigin === null) {
      return false;
    }
    let tabSessionCount = 0;
    for (const [existingToken, session] of sessions) {
      if (session.expiresAt !== undefined && session.expiresAt < now()) {
        sessions.delete(existingToken);
      } else if (session.tabId === tabId) {
        tabSessionCount += 1;
      }
    }
    if (tabSessionCount >= maxSessionsPerTab) {
      return false;
    }
    sessions.set(token, {
      widgetId,
      token,
      tabId,
      parentOrigin,
      parentDocumentId: sender.documentId,
      expiresAt: now() + pendingLifetimeMs,
    });
    return true;
  }

  function sessionForFrame(
    widgetId: unknown,
    token: unknown,
    sender: chrome.runtime.MessageSender,
  ) {
    if (
      !isWidgetId(widgetId) ||
      typeof token !== 'string' ||
      !isWidgetFrame(sender)
    ) {
      return null;
    }
    const session = sessions.get(token);
    let tabOrigin: string;
    try {
      tabOrigin = new URL(sender.tab?.url ?? '').origin;
    } catch {
      return null;
    }
    return session &&
      session.widgetId === widgetId &&
      session.tabId === sender.tab?.id &&
      session.parentOrigin === tabOrigin
      ? session
      : null;
  }

  function claim(
    widgetId: unknown,
    token: unknown,
    sender: chrome.runtime.MessageSender,
  ) {
    const session = sessionForFrame(widgetId, token, sender);
    if (
      !session ||
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

  function isAuthorized(
    widgetId: unknown,
    token: unknown,
    sender: chrome.runtime.MessageSender,
  ) {
    const session = sessionForFrame(widgetId, token, sender);
    return Boolean(
      session &&
      session.frameId !== undefined &&
      session.frameId === sender.frameId &&
      (!session.documentId || session.documentId === sender.documentId),
    );
  }

  function revoke(
    widgetId: unknown,
    token: unknown,
    sender: chrome.runtime.MessageSender,
  ) {
    if (
      !isWidgetId(widgetId) ||
      !isParentSender(widgetId, sender) ||
      typeof token !== 'string'
    ) {
      return false;
    }
    const session = sessions.get(token);
    if (
      !session ||
      session.widgetId !== widgetId ||
      session.tabId !== sender.tab?.id ||
      session.parentOrigin !== senderOrigin(sender) ||
      (session.parentDocumentId &&
        session.parentDocumentId !== sender.documentId)
    ) {
      return false;
    }
    sessions.delete(token);
    return true;
  }

  function removeTab(tabId: number) {
    for (const [token, session] of sessions) {
      if (session.tabId === tabId) {
        sessions.delete(token);
      }
    }
  }

  return { register, claim, isAuthorized, revoke, removeTab };
}

export type WidgetFrameAuthorization = ReturnType<
  typeof createWidgetFrameAuthorization
>;
