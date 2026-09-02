import React from 'react';
import { twMerge } from '@metamask/design-system-react';

export const CHART_COLLAPSE_DURATION_MS = 300;

export type PerpsExpandableChartPanelProps = {
  isExpanded: boolean;
  id: string;
  label: string;
  children: React.ReactNode;
};

/**
 * Full-width expandable chart region. Height and opacity animate with the
 * page's 300ms ease-in-out convention; the chart subtree unmounts while
 * collapsed so hidden focusables and the TradingView instance are disposed.
 *
 * @param props - Component props.
 * @param props.isExpanded - Whether the panel should be open.
 * @param props.id - Region id targeted by the header toggle's aria-controls.
 * @param props.label - Accessible name for the region.
 * @param props.children - Chart content rendered while expanded.
 */
export const PerpsExpandableChartPanel = ({
  isExpanded,
  id,
  label,
  children,
}: PerpsExpandableChartPanelProps) => {
  return (
    <div
      id={id}
      role="region"
      aria-label={label}
      aria-hidden={!isExpanded}
      data-testid={id}
      className={twMerge(
        'grid shrink-0 motion-reduce:transition-none motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-in-out',
        isExpanded
          ? 'grid-rows-[1fr] opacity-100'
          : 'grid-rows-[0fr] opacity-0',
      )}
    >
      <div className="min-h-0 overflow-hidden">
        {isExpanded ? children : null}
      </div>
    </div>
  );
};
