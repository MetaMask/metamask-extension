import React, { useRef } from 'react';
import classnames from 'clsx';
import { useFullScreenDesign } from '../../../hooks/useFullScreenDesign';
import { AppHeaderUnlockedContent } from './app-header-unlocked-content';

export const AppHeader = () => {
  const menuRef = useRef<HTMLButtonElement>(null);
  const isFullScreenDesign = useFullScreenDesign();

  return (
    <header
      className={classnames(
        'multichain-app-header flex w-full shrink-0 items-center gap-2 border-b border-muted bg-background-default pl-2 pr-4',
        isFullScreenDesign
          ? 'h-[var(--header-height-fullscreen-design)] py-2'
          : 'min-h-[var(--header-height)] py-2',
      )}
      data-testid="parent-selector-header-navbar"
    >
      <AppHeaderUnlockedContent menuRef={menuRef} />
    </header>
  );
};
