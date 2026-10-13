import {
  bindHostColorScheme,
  injectPageStyles,
  removePageStyles,
} from '../lib/ui';
import { bindWidgetTriggers, injectWidget } from './host';

jest.mock('../lib/ui', () => ({
  bindHostColorScheme: jest.fn(),
  injectPageStyles: jest.fn(),
  removePageStyles: jest.fn(),
}));

describe('injectWidget', () => {
  const originalAttachShadow = HTMLElement.prototype.attachShadow;

  beforeEach(() => {
    jest.clearAllMocks();
    document.body.replaceChildren();
    Object.assign(globalThis.chrome, {
      runtime: {
        getURL: (path: string) => `chrome-extension://test/${path}`,
      },
    });
    jest
      .spyOn(HTMLElement.prototype, 'attachShadow')
      .mockImplementation(function attachShadow(this: HTMLElement) {
        return originalAttachShadow.call(this, { mode: 'open' });
      });
    jest.mocked(bindHostColorScheme).mockImplementation((_host, onChange) => {
      onChange?.('dark');
      return jest.fn();
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows, resets, and removes the widget frame', () => {
    const unbind = jest.fn();
    let updateTheme: (theme: 'light' | 'dark') => void = () => undefined;
    jest.mocked(bindHostColorScheme).mockImplementation((_host, onChange) => {
      if (onChange) {
        updateTheme = onChange;
      }
      return unbind;
    });
    const widget = injectWidget();
    const frame = widget.shadowHost.shadowRoot?.querySelector('iframe');

    expect(injectPageStyles).toHaveBeenCalledTimes(1);
    widget.show('ETH');
    expect(frame?.src).toBe(
      'chrome-extension://test/cashtag-widget.html?symbol=ETH&theme=light',
    );

    updateTheme('dark');
    expect(frame?.src).toBe(
      'chrome-extension://test/cashtag-widget.html?symbol=ETH&theme=dark',
    );

    widget.reset();
    expect(frame).not.toHaveAttribute('src');

    widget.stop();
    expect(unbind).toHaveBeenCalledTimes(1);
    expect(removePageStyles).toHaveBeenCalledTimes(1);
    expect(widget.shadowHost.isConnected).toBe(false);
  });
});

describe('bindWidgetTriggers', () => {
  beforeEach(() => {
    document.body.innerHTML =
      '<article data-testid="tweet"><a href="/search?q=%24ETH&src=cashtag_click">$ETH</a></article>';
  });

  it('binds matching anchors and removes the binding on stop', async () => {
    const shadowHost = document.createElement('div');
    shadowHost.id = 'widget';
    document.body.append(shadowHost);
    const widget = {
      shadowHost,
      show: jest.fn(),
      reset: jest.fn(),
      stop: jest.fn(),
    };
    const triggers = bindWidgetTriggers(
      widget,
      jest.fn().mockResolvedValue({}),
    );
    const anchor = document.querySelector('a');

    await Promise.resolve();
    expect(anchor).toHaveAttribute('interestfor', 'widget');

    const querySelector = jest.spyOn(document, 'querySelector');
    querySelector.mockImplementation((selector) =>
      selector.includes(':interest-source')
        ? anchor
        : Document.prototype.querySelector.call(document, selector),
    );
    const opened = new Event('beforetoggle');
    Object.defineProperty(opened, 'newState', { value: 'open' });
    shadowHost.dispatchEvent(opened);

    expect(widget.show).toHaveBeenCalledWith('ETH');

    const closed = new Event('beforetoggle');
    Object.defineProperty(closed, 'newState', { value: 'closed' });
    shadowHost.dispatchEvent(closed);
    expect(widget.reset).toHaveBeenCalledTimes(1);

    triggers.stop();
    expect(anchor).not.toHaveAttribute('interestfor');
  });
});
