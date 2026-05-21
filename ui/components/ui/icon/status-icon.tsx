import React, { Suspense } from 'react';
import { mmLazy } from '../../../helpers/utils/mm-lazy';

const StatusIconContent = mmLazy(() => import('./status-icon-content.tsx'));

type Props = {
  state: 'loading' | 'success' | 'fail';
  className?: string;
};

export function StatusIcon({ state, className }: Props) {
  return (
    <Suspense fallback={null}>
      <StatusIconContent state={state} className={className} />
    </Suspense>
  );
}
