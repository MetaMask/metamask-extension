import React from 'react';
import classnames from 'classnames';
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
      className={classnames('multichain-app-header', {
        'multichain-app-header-shadow': popupStatus,
      })}
      alignItems={AlignItems.center}
      width={BlockSize.Full}
      backgroundColor={backgroundColor}
    >
      {children}
    </Box>
  );
};
