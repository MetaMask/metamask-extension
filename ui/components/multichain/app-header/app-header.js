import React, { useRef } from 'react';
import cn from 'clsx';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
} from '../../../helpers/constants/design-system';
import { Box } from '../../component-library';
import { getEnvironmentType } from '../../../../shared/lib/environment-type';
import { ENVIRONMENT_TYPE_FULLSCREEN } from '../../../../shared/constants/app';
import { MultichainMetaFoxLogo } from './multichain-meta-fox-logo';
import { AppHeaderUnlockedContent } from './app-header-unlocked-content';

export const AppHeader = () => {
  const menuRef = useRef(null);
  const showFullscreenLogo =
    getEnvironmentType() === ENVIRONMENT_TYPE_FULLSCREEN;

  return (
    <header
      className="multichain-app-header flex w-full shrink-0 flex-col items-stretch bg-background-default"
      data-testid="parent-selector-header-navbar"
    >
      <div
        className={cn(
          'hidden justify-center m-2',
          showFullscreenLogo && 'sm:flex',
        )}
      >
        <MultichainMetaFoxLogo />
      </div>
      <Box
        className="multichain-app-header__contents flex"
        alignItems={AlignItems.center}
        width={BlockSize.Full}
        backgroundColor={BackgroundColor.backgroundDefault}
        padding={2}
        paddingLeft={2}
        paddingRight={4}
        gap={2}
      >
        <AppHeaderUnlockedContent menuRef={menuRef} />
      </Box>
    </header>
  );
};
