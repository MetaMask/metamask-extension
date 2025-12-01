import React, { ReactNode } from 'react';
import { Box } from '../../../../component-library';
import {
  Display,
  FlexDirection,
  BlockSize,
  JustifyContent,
} from '../../../../../helpers/constants/design-system';
import { ASSET_CELL_HEIGHT } from '../../constants';

type GenericAssetCellLayoutProps = {
  onClick?: () => void;
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
  badge,
  headerLeftDisplay,
  headerRightDisplay,
  footerLeftDisplay,
  footerRightDisplay,
}: GenericAssetCellLayoutProps) {
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
        className={onClick ? 'hover:bg-hover cursor-pointer' : ''}
        style={{
          height: ASSET_CELL_HEIGHT,
        }}
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
