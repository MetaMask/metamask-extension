import React, { ReactNode, useState } from 'react';
import { Box } from '../../../../component-library';
import {
  Display,
  FlexDirection,
  BlockSize,
  JustifyContent,
} from '../../../../../helpers/constants/design-system';

type GenericAssetCellLayoutProps = {
  onClick?: () => void;
  disableHover?: boolean;
  badge: ReactNode;
  headerLeftDisplay: ReactNode;
  headerRightDisplay: ReactNode;
  footerLeftDisplay: ReactNode;
  footerRightDisplay: ReactNode;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function GenericAssetCellLayout({
  onClick,
  disableHover = false,
  badge,
  headerLeftDisplay,
  headerRightDisplay,
  footerLeftDisplay,
  footerRightDisplay,
}: GenericAssetCellLayoutProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      width={BlockSize.Full}
      height={BlockSize.Full}
      gap={4}
    >
      <Box
        as="a"
        onClick={(e?: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
          e?.preventDefault();
          if (onClick) {
            onClick();
          }
        }}
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        paddingTop={2}
        paddingBottom={2}
        paddingLeft={4}
        paddingRight={4}
        width={BlockSize.Full}
        style={{
          height: 62,
          cursor: onClick ? 'pointer' : 'auto',
          backgroundColor:
            !disableHover && isHovered
              ? 'var(--color-background-default-hover)'
              : 'transparent',
          transition: 'background-color 0.2s ease-in-out',
        }}
        onMouseEnter={() => !disableHover && setIsHovered(true)}
        onMouseLeave={() => !disableHover && setIsHovered(false)}
        data-testid="multichain-token-list-button"
      >
        {badge}
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          width={BlockSize.Full}
          style={{ flexGrow: 1, overflow: 'hidden' }}
          justifyContent={JustifyContent.center}
        >
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Row}
            justifyContent={JustifyContent.spaceBetween}
          >
            {headerLeftDisplay}
            {headerRightDisplay}
          </Box>

          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Row}
            justifyContent={JustifyContent.spaceBetween}
          >
            {footerLeftDisplay}
            {footerRightDisplay}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
