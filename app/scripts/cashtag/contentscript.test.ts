import { createTickerResolver } from './lib/ticker-resolver';
import { attachPageVisibility, createWidgetLifecycle } from './contentscript';
import type { WidgetHandle } from './widget/host';

function deferred<Value>() {
  let resolve!: (value: Value) => void;
  const promise = new Promise<Value>((next) => {
    resolve = next;
  });
  return { promise, resolve };
}

// Lets a queued mount reach its first await before the test continues.
function flush() {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

function widgetHandle(): WidgetHandle {
  return {
    shadowHost: document.createElement('div'),
    show: jest.fn(),
    reset: jest.fn(),
    stop: jest.fn(),
  };
}

describe('createWidgetLifecycle', () => {
  function setup() {
    const widget = widgetHandle();
    const pills = { stop: jest.fn() };
    const triggers = { stop: jest.fn() };
    const inject = deferred<WidgetHandle>();
    const injectWidget = jest.fn().mockReturnValue(inject.promise);
    const injectPills = jest.fn().mockResolvedValue(pills);
    const bindWidgetTriggers = jest.fn().mockReturnValue(triggers);

    const lifecycle = createWidgetLifecycle({
      injectWidget,
      injectPills,
      bindWidgetTriggers,
      createTickerResolver,
      sendRuntimeMessage: jest.fn().mockResolvedValue(undefined),
    });

    return {
      lifecycle,
      widget,
      pills,
      triggers,
      inject,
      injectWidget,
      injectPills,
      bindWidgetTriggers,
    };
  }

  it('does not inject a second widget while the first start is still awaiting', async () => {
    const { lifecycle, widget, inject, injectWidget } = setup();

    const first = lifecycle.setEnabled(true);
    const second = lifecycle.setEnabled(true);
    inject.resolve(widget);
    await Promise.all([first, second]);

    expect(injectWidget).toHaveBeenCalledTimes(1);
  });

  it('discards a start that is still injecting when the widget is disabled', async () => {
    const { lifecycle, widget, inject, pills, triggers } = setup();

    const starting = lifecycle.setEnabled(true);
    await flush();
    const stopping = lifecycle.setEnabled(false);
    inject.resolve(widget);
    await Promise.all([starting, stopping]);

    expect(widget.stop).toHaveBeenCalledTimes(1);
    expect(pills.stop).not.toHaveBeenCalled();
    expect(triggers.stop).not.toHaveBeenCalled();
  });

  it('starts again after a disable that landed during the first inject', async () => {
    const { lifecycle, widget, inject, injectWidget, injectPills } = setup();
    const secondWidget = widgetHandle();
    injectWidget
      .mockReturnValueOnce(inject.promise)
      .mockResolvedValueOnce(secondWidget);

    const starting = lifecycle.setEnabled(true);
    await flush();
    const stopping = lifecycle.setEnabled(false);
    inject.resolve(widget);
    await Promise.all([starting, stopping]);
    await lifecycle.setEnabled(true);

    expect(injectWidget).toHaveBeenCalledTimes(2);
    expect(injectPills).toHaveBeenCalledTimes(1);
    expect(widget.stop).toHaveBeenCalledTimes(1);
    expect(secondWidget.stop).not.toHaveBeenCalled();
  });
});

describe('attachPageVisibility', () => {
  it('restarts the widget on a back-forward cache restore', async () => {
    const lifecycle = {
      setEnabled: jest.fn().mockResolvedValue(undefined),
      stop: jest.fn(),
    };
    attachPageVisibility(lifecycle, async () => true);

    window.dispatchEvent(new Event('pagehide'));
    expect(lifecycle.stop).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new Event('pageshow'));
    await Promise.resolve();
    expect(lifecycle.setEnabled).not.toHaveBeenCalled();

    const restored = new Event('pageshow') as PageTransitionEvent;
    Object.defineProperty(restored, 'persisted', { value: true });
    window.dispatchEvent(restored);
    await Promise.resolve();
    expect(lifecycle.setEnabled).toHaveBeenCalledWith(true);
  });
});
