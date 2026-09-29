import { onWidgetUpdate, receiveWidgetUpdate } from './frame-updates';

describe('onWidgetUpdate', () => {
  it('delivers the latest update to a renderer that subscribes after it arrives', () => {
    receiveWidgetUpdate({ type: 'cashtag.theme', theme: 'dark' });
    const listener = jest.fn();

    const unsubscribe = onWidgetUpdate(listener);
    expect(listener).toHaveBeenCalledWith({
      type: 'cashtag.theme',
      theme: 'dark',
    });

    unsubscribe();
    receiveWidgetUpdate({ type: 'cashtag.theme', theme: 'light' });
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
