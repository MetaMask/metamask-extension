import React from 'react';

export type DragHandleIconProps = {
  size?: number;
  className?: string;
  color?: string;
};

/**
 * 6-dots drag indicator icon (2 columns x 3 rows) matching Material Design / Figma drag_indicator.
 * @param options0
 * @param options0.size
 * @param options0.className
 * @param options0.color
 */
export const DragHandleIcon = ({
  size = 16,
  className = '',
  color = 'currentColor',
}: DragHandleIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={color}
    className={className}
    aria-hidden="true"
    data-testid="drag-handle-icon-svg"
  >
    <path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
  </svg>
);
