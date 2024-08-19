import React from 'react';
import classnames from 'classnames';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  Display,
} from '../../../helpers/constants/design-system';
import { Box, BoxProps } from '../../component-library';

type AppHeaderContainerProps = {
  isUnlocked: boolean;
  popupStatus: boolean;
  headerBottomMargin: BoxProps<typeof Box>['marginBottom'];
};

export const AppHeaderContainer = ({
  isUnlocked,
  popupStatus,
  headerBottomMargin,
  children,
}: React.PropsWithChildren<AppHeaderContainerProps>) => {
  const backgroundColor =
    !isUnlocked || popupStatus
      ? BackgroundColor.backgroundDefault
      : BackgroundColor.backgroundAlternative;

  return (
    <Box
      display={Display.Flex}
      className={classnames('multichain-app-header', {
        'multichain-app-header-shadow': !isUnlocked || popupStatus,
      })}
      marginBottom={headerBottomMargin}
      alignItems={AlignItems.center}
      width={BlockSize.Full}
      backgroundColor={backgroundColor}
    >
      {children}
    </Box>
  );
};
