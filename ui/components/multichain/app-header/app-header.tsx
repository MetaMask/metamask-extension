import React, { useRef } from 'react';
import classnames from 'clsx';
import { ENVIRONMENT_TYPE_FULLSCREEN } from '#shared/constants/app';
import {
  WIDE_SCREEN_REDESIGN_AB_KEY,
  WIDE_SCREEN_REDESIGN_AB_TEST_VARIANTS,
} from '#shared/lib/ab-testing/configs/wide-screen-redesign';
import { getEnvironmentType } from '../../../../shared/lib/environment-type';
import { useAppLayout } from '../../../contexts/app-layout';
import { useABTest } from '../../../hooks/useABTest';
import { MultichainMetaFoxLogo } from './multichain-meta-fox-logo';
import { AppHeaderUnlockedContent } from './app-header-unlocked-content';

export const AppHeader = () => {
  const menuRef = useRef<HTMLButtonElement>(null);
  const { isWideLayout } = useAppLayout();
  const { variant: wideScreenVariant } = useABTest(
    WIDE_SCREEN_REDESIGN_AB_KEY,
    WIDE_SCREEN_REDESIGN_AB_TEST_VARIANTS,
    undefined,
    { trackExposure: false },
  );

  // The wide layout shows the logo in the side nav instead of the header.
  const showLegacyMMLogo =
    !wideScreenVariant.useWideLayout &&
    getEnvironmentType() === ENVIRONMENT_TYPE_FULLSCREEN;

  return (
    <header
      className="multichain-app-header flex w-full shrink-0 flex-col items-stretch border-b border-muted bg-background-default"
      data-testid="parent-selector-header-navbar"
    >
      {showLegacyMMLogo && (
        <div className="m-2 hidden justify-center md:flex">
          <MultichainMetaFoxLogo />
        </div>
      )}
      <div
        className={classnames(
          'flex items-center gap-2 pl-2 pr-4 py-2',
          isWideLayout
            ? 'h-[var(--header-height-wide-layout)]'
            : 'min-h-[var(--header-height)]',
        )}
      >
        <AppHeaderUnlockedContent
          menuRef={menuRef}
          isWideLayout={isWideLayout}
        />
      </div>
    </header>
  );
};
