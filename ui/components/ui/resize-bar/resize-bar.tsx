import React, { useRef } from 'react';

type ResizeBarProps = {
  property: string;
  value: number;
  min: number;
  max: number;
  onResize?: (width: number) => void;
};

const className =
  'absolute -right-1 top-0 z-10 h-full w-2 cursor-col-resize touch-none focus-visible:outline-none before:absolute before:inset-y-0 before:left-[3px] before:w-px before:bg-border-muted hover:before:bg-primary-default focus-visible:before:bg-primary-default';

export const ResizeBar = ({
  property,
  min,
  max,
  value,
  onResize,
}: ResizeBarProps) => {
  const dragOriginLeft = useRef<number | null>(null);
  const resolvedValueNow = value ?? Math.round((min + max) / 2);

  const getResizeTarget = (handle: HTMLDivElement) => handle.parentElement;

  const clampWidth = (width: number) =>
    Math.min(max, Math.max(min, Math.round(width)));

  const setWidth = (target: HTMLElement, width: number) => {
    const nextWidth = clampWidth(width);
    target.style.setProperty(property, `${nextWidth}px`);
    onResize?.(nextWidth);
    return nextWidth;
  };

  const readCurrentWidth = (target: HTMLElement) => {
    const parsed = Number.parseInt(target.style.getPropertyValue(property), 10);
    return Number.isFinite(parsed) ? parsed : resolvedValueNow;
  };

  const resize = (event: React.PointerEvent<HTMLDivElement>) => {
    if (
      event.currentTarget.dataset.resizing !== 'true' ||
      dragOriginLeft.current === null
    ) {
      return;
    }

    const target = getResizeTarget(event.currentTarget);
    if (!target) {
      return;
    }

    const width = setWidth(target, event.clientX - dragOriginLeft.current);
    event.currentTarget.setAttribute('aria-valuenow', String(width));
  };

  const resizeByKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const target = getResizeTarget(event.currentTarget);
    if (!target) {
      return;
    }

    const currentWidth = readCurrentWidth(target);
    const widthsByKey: Record<string, number> = {
      ArrowLeft: currentWidth - 16,
      ArrowRight: currentWidth + 16,
      Home: min,
      End: max,
    };
    const nextWidth = widthsByKey[event.key];

    if (nextWidth === undefined) {
      return;
    }

    event.preventDefault();
    const width = setWidth(target, nextWidth);
    event.currentTarget.setAttribute('aria-valuenow', String(width));
  };

  const endResize = (event: React.PointerEvent<HTMLDivElement>) => {
    dragOriginLeft.current = null;
    delete event.currentTarget.dataset.resizing;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  return (
    <div
      role="separator"
      aria-label="Resize"
      aria-orientation="vertical"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={resolvedValueNow}
      tabIndex={0}
      className={className}
      onPointerDown={(event) => {
        const target = getResizeTarget(event.currentTarget);
        if (!target) {
          return;
        }

        dragOriginLeft.current = target.getBoundingClientRect().left;
        event.currentTarget.dataset.resizing = 'true';
        event.currentTarget.setPointerCapture?.(event.pointerId);
      }}
      onPointerMove={resize}
      onPointerUp={endResize}
      onPointerCancel={endResize}
      onKeyDown={resizeByKey}
    />
  );
};
