import React from 'react';
import classnames from 'clsx';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
} from '@metamask/design-system-react';

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
      ? BoxBackgroundColor.BackgroundDefault
      : BoxBackgroundColor.BackgroundAlternative;

  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      className={classnames('multichain-app-header w-full', {
        'multichain-app-header-shadow': popupStatus,
      })}
      alignItems={BoxAlignItems.Center}
      backgroundColor={backgroundColor}
    >
      {children}
    </Box>
  );
};
