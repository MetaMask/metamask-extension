import { EXTENSION_MESSAGES } from '#shared/constants/messages';

const tokenPattern = /^[0-9a-f]{64}$/u;
const xOrigins = new Set(['https://x.com', 'https://www.x.com']);
let activeToken: string | null = null;
let claimAttempted = false;

function isInitMessage(value: unknown): value is {
  type: 'METAMASK_X_WIDGET_INIT';
  authToken: string;
  symbol: string;
  theme: 'light' | 'dark';
} {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const message = value as Record<string, unknown>;
  return (
    message.type === 'METAMASK_X_WIDGET_INIT' &&
    typeof message.authToken === 'string' &&
    tokenPattern.test(message.authToken) &&
    typeof message.symbol === 'string' &&
    message.symbol.length > 0 &&
    message.symbol.length <= 32 &&
    (message.theme === 'light' || message.theme === 'dark')
  );
}

window.addEventListener('message', async (event: MessageEvent<unknown>) => {
  if (!xOrigins.has(event.origin)) {
    return;
  }
  const message = event.data;
  if (
    activeToken &&
    message &&
    typeof message === 'object' &&
    (message as { type?: unknown }).type === 'METAMASK_X_WIDGET_THEME' &&
    (message as { authToken?: unknown }).authToken === activeToken
  ) {
    const { theme } = message as { theme?: unknown };
    if (theme === 'light' || theme === 'dark') {
      document.documentElement.dataset.theme = theme;
    }
    return;
  }
  if (claimAttempted || !isInitMessage(message)) {
    return;
  }
  claimAttempted = true;

  try {
    const response = await new Promise<{ body?: { ok?: boolean } } | undefined>(
      (resolve) => {
        chrome.runtime.sendMessage(
          {
            type: EXTENSION_MESSAGES.CLAIM_X_WIDGET_FRAME,
            body: { authToken: message.authToken },
          },
          (result) => {
            if (chrome.runtime.lastError) {
              resolve(undefined);
              return;
            }
            resolve(result);
          },
        );
      },
    );
    if (response?.body?.ok !== true || activeToken) {
      return;
    }
    activeToken = message.authToken;
    const { mountFrame } = await import('./frame');
    await mountFrame({
      authToken: message.authToken,
      symbol: message.symbol,
      theme: message.theme,
    });
  } catch {
    // A frame without a valid registration stays blank.
  }
});
