import React, { type ReactNode } from 'react';
import { usePerpsViewActive } from '../../../hooks/perps/stream/usePerpsViewActive';

type PerpsViewStreamBoundaryProps = Readonly<{
  children: ReactNode;
}>;

/**
 * Perps-only boundary for non-route surfaces (e.g. account overview tab)
 * that still require live Perps stream emission.
 * @param options0
 * @param options0.children
 */
export function PerpsViewStreamBoundary({
  children,
}: PerpsViewStreamBoundaryProps) {
  usePerpsViewActive('PerpsViewStreamBoundary');
  return <>{children}</>;
}
