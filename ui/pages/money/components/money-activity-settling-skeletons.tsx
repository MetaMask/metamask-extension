import React, { type ReactNode } from 'react';
import { Skeleton } from '@metamask/design-system-react';

export type MoneyActivitySettlingSkeletonsProps = {
  children?: ReactNode;
  className?: string;
};

/**
 * Placeholder rows shown while Money activity is still filling its first page.
 *
 * @param options0 - Component props.
 * @param options0.children - Optional content after the skeletons, such as a
 * scroll sentinel.
 * @param options0.className - Layout classes. Defaults match the Home preview.
 * @returns Three full-width row skeletons.
 */
export function MoneyActivitySettlingSkeletons({
  children,
  className = 'flex flex-col gap-3 px-4 py-3',
}: MoneyActivitySettlingSkeletonsProps) {
  return (
    <div className={className} data-testid="money-activity-settling">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      {children}
    </div>
  );
}
