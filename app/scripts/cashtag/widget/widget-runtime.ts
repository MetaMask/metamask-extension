import browser from 'webextension-polyfill';

let authToken: string | null = null;

export function setWidgetAuthToken(token: string) {
  authToken = token;
}

export function sendWidgetMessage(
  type: string,
  body: Record<string, unknown> = {},
) {
  if (!authToken) {
    return Promise.reject(new Error('Widget frame is not authorized'));
  }
  return browser.runtime.sendMessage({
    type,
    body: { ...body, authToken },
  });
}
