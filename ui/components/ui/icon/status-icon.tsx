import React from 'react';
import cn from 'clsx';
import { Icon, IconName, IconSize } from '@metamask/design-system-react';

type Props = {
  state: 'loading' | 'success' | 'fail';
  className?: string;
};

// Static, dependency-light status glyphs. A loading/success/fail indicator does
// not need the Rive WASM runtime; keeping it off this component removes the Rive
// runtime + rive.wasm from the home/activity critical path (they rendered eagerly
// via toasts, activity rows, and tx-status). Animated Rive surfaces (onboarding,
// perps tutorial) keep their lazy split.
const STATE_ICON: Record<Props['state'], { name: IconName; spin?: boolean }> = {
  loading: { name: IconName.Loading, spin: true },
  success: { name: IconName.Confirmation },
  fail: { name: IconName.Danger },
};

export function StatusIcon({ state, className }: Props) {
  const { name, spin } = STATE_ICON[state];
  return (
    <Icon
      name={name}
      size={IconSize.Lg}
      className={cn('size-6', spin && 'animate-spin', className)}
    />
  );
}
