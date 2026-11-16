import { renderHook, act } from '@testing-library/react';
import { recordUiInteraction } from '../store/actions';
import { useUiInteractionReporter } from './useUiInteractionReporter';

const mockDispatch = jest.fn();

jest.mock('../store/hooks', () => ({
  useDispatch: () => mockDispatch,
}));

jest.mock('../store/actions', () => ({
  recordUiInteraction: jest.fn(() => ({ type: 'recordUiInteraction' })),
}));

const mockRecordUiInteraction = jest.mocked(recordUiInteraction);

function fakeInteraction(isTrusted: boolean): Event {
  const event: Pick<Event, 'isTrusted'> = { isTrusted };
  return event as Event;
}

describe('useUiInteractionReporter', () => {
  let listeners: Map<string, EventListener>;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(1_000);
    mockDispatch.mockClear();
    mockRecordUiInteraction.mockClear();
    listeners = new Map();

    const originalAdd = document.addEventListener.bind(document);
    const originalRemove = document.removeEventListener.bind(document);

    jest
      .spyOn(document, 'addEventListener')
      .mockImplementation((type, listener, options) => {
        if (typeof listener === 'function') {
          listeners.set(String(type), listener);
        }
        originalAdd(type, listener, options);
      });
    jest
      .spyOn(document, 'removeEventListener')
      .mockImplementation((type, listener, options) => {
        if (listeners.get(String(type)) === listener) {
          listeners.delete(String(type));
        }
        originalRemove(type, listener, options);
      });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  function emit(type: string, isTrusted: boolean): void {
    const listener = listeners.get(type);
    if (listener === undefined) {
      throw new Error(`No ${type} listener installed`);
    }
    listener(fakeInteraction(isTrusted));
  }

  it('dispatches once per throttle window for clicks and key presses', () => {
    renderHook(() => useUiInteractionReporter());

    expect(document.addEventListener).toHaveBeenCalledWith(
      'pointerdown',
      expect.any(Function),
      { capture: true, passive: true },
    );
    expect(document.addEventListener).toHaveBeenCalledWith(
      'keydown',
      expect.any(Function),
      { capture: true, passive: true },
    );

    act(() => {
      emit('pointerdown', true);
      jest.setSystemTime(1_500);
      emit('pointerdown', true);
      emit('keydown', true);
    });

    expect(mockDispatch).toHaveBeenCalledTimes(1);

    act(() => {
      jest.setSystemTime(2_000);
      emit('keydown', true);
    });

    expect(mockDispatch).toHaveBeenCalledTimes(2);
    expect(mockRecordUiInteraction).toHaveBeenCalledTimes(2);
  });

  it('ignores mousemove', () => {
    renderHook(() => useUiInteractionReporter());

    expect(listeners.has('mousemove')).toBe(false);
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('ignores untrusted events', () => {
    renderHook(() => useUiInteractionReporter());

    act(() => {
      emit('pointerdown', false);
      emit('keydown', false);
    });

    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('removes its listeners on unmount', () => {
    const { unmount } = renderHook(() => useUiInteractionReporter());
    const pointerdown = listeners.get('pointerdown');
    const keydown = listeners.get('keydown');

    unmount();

    expect(document.removeEventListener).toHaveBeenCalledWith(
      'pointerdown',
      pointerdown,
      { capture: true, passive: true },
    );
    expect(document.removeEventListener).toHaveBeenCalledWith(
      'keydown',
      keydown,
      { capture: true, passive: true },
    );
    expect(listeners.has('pointerdown')).toBe(false);
    expect(listeners.has('keydown')).toBe(false);
  });
});
