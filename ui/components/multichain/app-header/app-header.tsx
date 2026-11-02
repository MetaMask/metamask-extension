import React, { useRef } from 'react';
import classnames from 'clsx';
import { ENVIRONMENT_TYPE_FULLSCREEN } from '#shared/constants/app';
import { getEnvironmentType } from '../../../../shared/lib/environment-type';
import { useFullScreenDesign } from '../../../hooks/useFullScreenDesign';
import { MultichainMetaFoxLogo } from './multichain-meta-fox-logo';
import { AppHeaderUnlockedContent } from './app-header-unlocked-content';

export const AppHeader = () => {
  const menuRef = useRef<HTMLButtonElement>(null);
  const isFullScreenDesign = useFullScreenDesign();
  // The fullscreen design shows the logo in the side nav, not in the app header
  const showLegacyMMLogo =
    !isFullScreenDesign && getEnvironmentType() === ENVIRONMENT_TYPE_FULLSCREEN;

  return (
    <header
      className="multichain-app-header flex w-full shrink-0 flex-col items-stretch border-b border-muted bg-background-default"
      data-testid="parent-selector-header-navbar"
    >
      {showLegacyMMLogo && (
        <div className="m-2 hidden justify-center sm:flex">
          <MultichainMetaFoxLogo />
        </div>
      )}
      <div
        className={classnames(
          'flex items-center gap-2 pl-2 pr-4 py-2',
          isFullScreenDesign
            ? 'h-[var(--header-height-fullscreen-design)]'
            : 'min-h-[var(--header-height)]',
        )}
      >
        <AppHeaderUnlockedContent menuRef={menuRef} />
      </div>
    </header>
  );
};
