import React from 'react';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  Display,
} from '../../../helpers/constants/design-system';
import { Box } from '../../component-library';

type AppHeaderContainerProps = {
  isUnlocked: boolean;
  popupStatus: boolean;
};

export const AppHeaderContainer = ({
  isUnlocked,
  popupStatus,
  children,
}: React.PropsWithChildren<AppHeaderContainerProps>) => {
  const backgroundColor =
    !isUnlocked || popupStatus
      ? BackgroundColor.backgroundDefault
      : BackgroundColor.backgroundAlternative;

  return (
    <Box
      display={Display.Flex}
      className="multichain-app-header"
      alignItems={AlignItems.center}
      width={BlockSize.Full}
      backgroundColor={backgroundColor}
    >
      {children}
    </Box>
  );
};
