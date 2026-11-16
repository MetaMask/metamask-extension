import React from 'react';

type Props = {
  property: string;
  ariaLabel?: string;
  value: number;
  minValue: number;
  maxValue: number;
};

const className =
  'absolute -right-1 top-0 z-10 h-full w-2 cursor-col-resize touch-none focus-visible:outline-none before:absolute before:inset-y-0 before:left-[3px] before:w-px before:bg-border-muted hover:before:bg-primary-default focus-visible:before:bg-primary-default';

export const ResizeBar = ({
  property,
  ariaLabel = 'Resize',
  minValue,
  maxValue,
  value,
}: Props) => {
  const resolvedValueNow = value ?? Math.round((minValue + maxValue) / 2);

  const getResizeTarget = (handle: HTMLDivElement) => handle.parentElement;

  const clampWidth = (width: number) =>
    Math.min(maxValue, Math.max(minValue, Math.round(width)));

  const setWidth = (target: HTMLElement, width: number) => {
    const nextWidth = clampWidth(width);
    target.style.setProperty(property, `${nextWidth}px`);
    return nextWidth;
  };

  const readCurrentWidth = (target: HTMLElement) => {
    const parsed = Number.parseInt(target.style.getPropertyValue(property), 10);
    return Number.isFinite(parsed) ? parsed : resolvedValueNow;
  };

  const resize = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.dataset.resizing !== 'true') {
      return;
    }

    const target = getResizeTarget(event.currentTarget);
    if (!target) {
      return;
    }

    const width = setWidth(
      target,
      event.clientX - target.getBoundingClientRect().left,
    );
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
      Home: minValue,
      End: maxValue,
    };
    const nextWidth = widthsByKey[event.key];

    if (nextWidth === undefined) {
      return;
    }

    event.preventDefault();
    const width = setWidth(target, nextWidth);
    event.currentTarget.setAttribute('aria-valuenow', String(width));
  };

  return (
    <div
      role="separator"
      aria-label={ariaLabel}
      aria-orientation="vertical"
      aria-valuemin={minValue}
      aria-valuemax={maxValue}
      aria-valuenow={resolvedValueNow}
      tabIndex={0}
      className={className}
      onPointerDown={(event) => {
        event.currentTarget.dataset.resizing = 'true';
        event.currentTarget.setPointerCapture?.(event.pointerId);
      }}
      onPointerMove={resize}
      onPointerUp={(event) => {
        delete event.currentTarget.dataset.resizing;
        event.currentTarget.releasePointerCapture?.(event.pointerId);
      }}
      onPointerCancel={(event) => {
        delete event.currentTarget.dataset.resizing;
        event.currentTarget.releasePointerCapture?.(event.pointerId);
      }}
      onKeyDown={resizeByKey}
    />
  );
};
