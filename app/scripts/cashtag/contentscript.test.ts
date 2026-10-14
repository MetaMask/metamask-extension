import { createTickerResolver } from './lib/ticker-resolver';
import { createWidgetLifecycle } from './contentscript';
import type { WidgetHandle } from './widget/host';

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
    const injectWidget = jest.fn().mockReturnValue(widget);
    const injectPills = jest.fn().mockReturnValue(pills);
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
      injectWidget,
      injectPills,
      bindWidgetTriggers,
    };
  }

  it('does not inject a second widget when already enabled', async () => {
    const { lifecycle, injectWidget } = setup();

    const first = lifecycle.setEnabled(true);
    const second = lifecycle.setEnabled(true);
    await Promise.all([first, second]);

    expect(injectWidget).toHaveBeenCalledTimes(1);
  });

  it('stops the widget when disabled', async () => {
    const { lifecycle, widget, pills, triggers } = setup();

    await lifecycle.setEnabled(true);
    await lifecycle.setEnabled(false);

    expect(widget.stop).toHaveBeenCalledTimes(1);
    expect(pills.stop).toHaveBeenCalledTimes(1);
    expect(triggers.stop).toHaveBeenCalledTimes(1);
  });

  it('starts again after being disabled', async () => {
    const { lifecycle, widget, injectWidget, injectPills } = setup();
    const secondWidget = widgetHandle();
    injectWidget.mockReturnValueOnce(widget).mockReturnValueOnce(secondWidget);

    await lifecycle.setEnabled(true);
    await lifecycle.setEnabled(false);
    await lifecycle.setEnabled(true);

    expect(injectWidget).toHaveBeenCalledTimes(2);
    expect(injectPills).toHaveBeenCalledTimes(2);
    expect(widget.stop).toHaveBeenCalledTimes(1);
    expect(secondWidget.stop).not.toHaveBeenCalled();
  });
});
