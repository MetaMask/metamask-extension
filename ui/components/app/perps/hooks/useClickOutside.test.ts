import { act, renderHook } from '@testing-library/react-hooks';
import type { RefObject } from 'react';
import { useOnClickOutside } from './useClickOutside';

function mouseDown(element: Element) {
  act(() => {
    element.dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true, cancelable: true }),
    );
  });
}

describe('useOnClickOutside', () => {
  let container: HTMLDivElement;
  let outside: HTMLDivElement;
  let containerRef: RefObject<HTMLDivElement>;

  beforeEach(() => {
    container = document.createElement('div');
    outside = document.createElement('div');
    document.body.append(container, outside);
    containerRef = { current: container };
  });

  afterEach(() => {
    container.remove();
    outside.remove();
  });

  describe('when active is true', () => {
    it('calls onClickOutside when mousedown occurs outside the container', () => {
      const onClickOutside = jest.fn();
      renderHook(() =>
        useOnClickOutside({
          containerRef,
          onClickOutside,
          active: true,
        }),
      );

      mouseDown(outside);

      expect(onClickOutside).toHaveBeenCalledTimes(1);
    });

    it('does not call onClickOutside when mousedown occurs inside the container', () => {
      const onClickOutside = jest.fn();
      const inner = document.createElement('span');
      container.appendChild(inner);

      renderHook(() =>
        useOnClickOutside({
          containerRef,
          onClickOutside,
          active: true,
        }),
      );

      mouseDown(inner);

      expect(onClickOutside).not.toHaveBeenCalled();
    });

    it('removes the listener on unmount', () => {
      const onClickOutside = jest.fn();
      const { unmount } = renderHook(() =>
        useOnClickOutside({
          containerRef,
          onClickOutside,
          active: true,
        }),
      );

      unmount();
      mouseDown(outside);

      expect(onClickOutside).not.toHaveBeenCalled();
    });
  });

  describe('when active is false', () => {
    it('does not call onClickOutside when mousedown occurs outside the container', () => {
      const onClickOutside = jest.fn();
      renderHook(() =>
        useOnClickOutside({
          containerRef,
          onClickOutside,
          active: false,
        }),
      );

      mouseDown(outside);

      expect(onClickOutside).not.toHaveBeenCalled();
    });
  });

  describe('when active is undefined', () => {
    it('does not register outside click handling', () => {
      const onClickOutside = jest.fn();
      renderHook(() =>
        useOnClickOutside({
          containerRef,
          onClickOutside,
        }),
      );

      mouseDown(outside);

      expect(onClickOutside).not.toHaveBeenCalled();
    });
  });

  describe('when active changes', () => {
    it('stops invoking onClickOutside after active becomes false', () => {
      const onClickOutside = jest.fn();
      const { rerender } = renderHook(
        ({ active }) =>
          useOnClickOutside({
            containerRef,
            onClickOutside,
            active,
          }),
        { initialProps: { active: true } },
      );

      mouseDown(outside);
      expect(onClickOutside).toHaveBeenCalledTimes(1);

      onClickOutside.mockClear();
      rerender({ active: false });
      mouseDown(outside);

      expect(onClickOutside).not.toHaveBeenCalled();
    });
  });
});
