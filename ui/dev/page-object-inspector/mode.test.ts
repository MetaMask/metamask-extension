import {
  readInspectorSettings,
  subscribeToInspectorSettings,
  writeInspectorSettings,
} from './mode';

describe('inspector settings', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('has both views off until something turns them on', () => {
    expect(readInspectorSettings()).toStrictEqual({
      hover: false,
      outline: false,
    });
  });

  it('reads back what was written', () => {
    writeInspectorSettings({ hover: true, outline: false });
    expect(readInspectorSettings()).toStrictEqual({
      hover: true,
      outline: false,
    });
  });

  it('allows hover and outline together', () => {
    writeInspectorSettings({ hover: true, outline: true });
    expect(readInspectorSettings()).toStrictEqual({
      hover: true,
      outline: true,
    });
  });

  it('falls back to off when the stored value is not valid JSON', () => {
    localStorage.setItem('metamask:page-object-inspector', 'nonsense');
    expect(readInspectorSettings()).toStrictEqual({
      hover: false,
      outline: false,
    });
  });

  it('ignores stored fields that are not booleans', () => {
    localStorage.setItem(
      'metamask:page-object-inspector',
      JSON.stringify({ hover: 'yes', outline: true }),
    );
    expect(readInspectorSettings()).toStrictEqual({
      hover: false,
      outline: true,
    });
  });

  it('notifies subscribers in the same document', () => {
    // The overlay and the settings page are separate React roots, and the
    // browser does not fire `storage` events at the document that wrote them.
    const listener = jest.fn();
    subscribeToInspectorSettings(listener);

    writeInspectorSettings({ hover: false, outline: true });

    expect(listener).toHaveBeenCalledWith({ hover: false, outline: true });
  });

  it('stops notifying after unsubscribe', () => {
    const listener = jest.fn();
    const unsubscribe = subscribeToInspectorSettings(listener);

    unsubscribe();
    writeInspectorSettings({ hover: true, outline: true });

    expect(listener).not.toHaveBeenCalled();
  });

  it('reports off when storage is unavailable', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });

    expect(readInspectorSettings()).toStrictEqual({
      hover: false,
      outline: false,
    });

    jest.restoreAllMocks();
  });
});
