import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { ResizeBar } from './resize-bar';

// Jest's jsdom build has no PointerEvent, so fireEvent would dispatch a plain
// Event and drop clientX.
class PointerEventPolyfill extends MouseEvent {
  pointerId: number;

  constructor(
    type: string,
    props: MouseEventInit & { pointerId?: number } = {},
  ) {
    super(type, props);
    this.pointerId = props.pointerId ?? 0;
  }
}

beforeAll(() => {
  Object.defineProperty(window, 'PointerEvent', {
    configurable: true,
    writable: true,
    value: PointerEventPolyfill,
  });
});

function renderResizeBar(value = 360, onResize?: (width: number) => void) {
  return render(
    <div>
      <ResizeBar
        property="--side-nav-width"
        value={value}
        min={240}
        max={480}
        onResize={onResize}
      />
    </div>,
  );
}

function widthOf(separator: HTMLElement) {
  return separator.parentElement?.style.getPropertyValue('--side-nav-width');
}

describe('ResizeBar', () => {
  it('resizes from the left edge captured on pointer down', () => {
    const onResize = jest.fn();
    const { getByRole } = renderResizeBar(360, onResize);
    const separator = getByRole('separator');
    const parent = separator.parentElement as HTMLElement;
    const rect = { left: 100 };

    jest
      .spyOn(parent, 'getBoundingClientRect')
      .mockImplementation(() => ({ left: rect.left }) as DOMRect);

    fireEvent.pointerDown(separator, { pointerId: 1, clientX: 460 });
    rect.left = 999;
    fireEvent.pointerMove(separator, { pointerId: 1, clientX: 500 });

    expect(widthOf(separator)).toBe('400px');
    expect(onResize).toHaveBeenCalledWith(400);
    expect(parent.getBoundingClientRect).toHaveBeenCalledTimes(1);
  });

  it('clamps a drag to the minimum and maximum', () => {
    const { getByRole } = renderResizeBar();
    const separator = getByRole('separator');
    const parent = separator.parentElement as HTMLElement;

    jest
      .spyOn(parent, 'getBoundingClientRect')
      .mockReturnValue({ left: 0 } as DOMRect);

    fireEvent.pointerDown(separator, { pointerId: 1, clientX: 0 });
    fireEvent.pointerMove(separator, { pointerId: 1, clientX: 100 });
    expect(widthOf(separator)).toBe('240px');

    fireEvent.pointerMove(separator, { pointerId: 1, clientX: 900 });
    expect(widthOf(separator)).toBe('480px');
  });

  it('steps the current value from the keyboard', () => {
    const { getByRole } = renderResizeBar();
    const separator = getByRole('separator');
    const parent = separator.parentElement as HTMLElement;
    parent.style.setProperty('--side-nav-width', '360px');

    fireEvent.keyDown(separator, { key: 'ArrowRight' });
    expect(widthOf(separator)).toBe('376px');

    fireEvent.keyDown(separator, { key: 'Home' });
    expect(widthOf(separator)).toBe('240px');
    expect(separator).toHaveAttribute('aria-valuenow', '240');
  });
});
