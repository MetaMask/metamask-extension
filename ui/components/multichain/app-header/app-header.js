import React, { useRef } from 'react';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
} from '../../../helpers/constants/design-system';
import { Box } from '../../component-library';
import { AppHeaderUnlockedContent } from './app-header-unlocked-content';

export const AppHeader = () => {
  const menuRef = useRef(null);

  return (
    <header
      className="multichain-app-header flex w-full shrink-0 flex-col items-stretch bg-background-default"
      data-testid="parent-selector-header-navbar"
    >
      <Box
        className="multichain-app-header__contents flex"
        alignItems={AlignItems.center}
        width={BlockSize.Full}
        backgroundColor={BackgroundColor.backgroundDefault}
        padding={2}
        paddingRight={4}
        gap={2}
      >
        <AppHeaderUnlockedContent menuRef={menuRef} />
      </Box>
    </header>
  );
};
