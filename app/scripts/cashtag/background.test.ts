import { EXTENSION_MESSAGES } from '#shared/constants/messages';
import { isAllowedCashtagSender } from './background';

const extensionId = 'testid';
const widgetUrl = `chrome-extension://${extensionId}/cashtag-widget.html?symbol=ETH`;
const xTab = { id: 1, url: 'https://x.com/home' } as chrome.tabs.Tab;

function sender(
  overrides: Partial<chrome.runtime.MessageSender>,
): chrome.runtime.MessageSender {
  return {
    id: extensionId,
    ...overrides,
  };
}

describe('isAllowedCashtagSender', () => {
  beforeEach(() => {
    Object.assign(chrome.runtime, {
      id: extensionId,
      getURL: (path: string) => `chrome-extension://${extensionId}/${path}`,
    });
  });

  it('allows data requests from the top-frame X content script', () => {
    expect(
      isAllowedCashtagSender(
        EXTENSION_MESSAGES.GET_DATA,
        sender({ frameId: 0, url: 'https://x.com/home' }),
      ),
    ).toBe(true);
  });

  it('rejects data requests from another website or an X subframe', () => {
    expect(
      isAllowedCashtagSender(
        EXTENSION_MESSAGES.GET_DATA,
        sender({ frameId: 0, url: 'https://example.com/' }),
      ),
    ).toBe(false);
    expect(
      isAllowedCashtagSender(
        EXTENSION_MESSAGES.GET_DATA,
        sender({ frameId: 2, url: 'https://x.com/embed' }),
      ),
    ).toBe(false);
  });

  it('allows widget actions only from the widget frame', () => {
    expect(
      isAllowedCashtagSender(
        EXTENSION_MESSAGES.OPEN_EXTENSION,
        sender({ frameId: 1, tab: xTab, url: widgetUrl }),
      ),
    ).toBe(true);
    expect(
      isAllowedCashtagSender(
        EXTENSION_MESSAGES.SET_X_WIDGET_ENABLED,
        sender({ frameId: 1, tab: xTab, url: widgetUrl }),
      ),
    ).toBe(true);
  });

  it('rejects widget actions from other extension pages', () => {
    expect(
      isAllowedCashtagSender(
        EXTENSION_MESSAGES.OPEN_EXTENSION,
        sender({
          frameId: 1,
          tab: xTab,
          url: `chrome-extension://${extensionId}/home.html`,
        }),
      ),
    ).toBe(false);
  });

  it('rejects the widget frame when its parent tab is not X', () => {
    expect(
      isAllowedCashtagSender(
        EXTENSION_MESSAGES.OPEN_EXTENSION,
        sender({
          frameId: 1,
          tab: {
            id: 2,
            url: 'https://example.com/',
          } as chrome.tabs.Tab,
          url: widgetUrl,
        }),
      ),
    ).toBe(false);
  });
});
