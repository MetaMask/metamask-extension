import React, { ReactNode } from 'react';
import {
  Box,
  BoxFlexDirection,
  BoxJustifyContent,
} from '@metamask/design-system-react';
import { ASSET_CELL_HEIGHT } from '../../constants';

type GenericAssetCellLayoutProps = {
  onClick?: () => void;
  badge: ReactNode;
  headerLeftDisplay: ReactNode;
  headerRightDisplay: ReactNode;
  footerLeftDisplay: ReactNode;
  footerRightDisplay: ReactNode;
};

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
      flexDirection={BoxFlexDirection.Row}
      gap={4}
      className="flex h-full w-full [container-name:list-item] [container-type:inline-size]"
    >
      <Box asChild>
        <a
          onClick={(e?: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
            e?.preventDefault();
            if (onClick) {
              onClick();
            }
          }}
          className={`flex w-full flex-row py-2 px-4 ${onClick ? 'hover:bg-hover cursor-pointer' : ''}`}
          style={{
            height: ASSET_CELL_HEIGHT,
          }}
          data-testid="multichain-token-list-button"
        >
          {badge}
          <Box
            flexDirection={BoxFlexDirection.Column}
            justifyContent={BoxJustifyContent.Center}
            className="flex w-full overflow-hidden grow"
          >
            <Box
              flexDirection={BoxFlexDirection.Row}
              justifyContent={BoxJustifyContent.Between}
              className="flex"
            >
              {headerLeftDisplay}
              {headerRightDisplay}
            </Box>

            <Box
              flexDirection={BoxFlexDirection.Row}
              justifyContent={BoxJustifyContent.Between}
              className="flex"
            >
              {footerLeftDisplay}
              {footerRightDisplay}
            </Box>
          </Box>
        </a>
      </Box>
    </Box>
  );
}
