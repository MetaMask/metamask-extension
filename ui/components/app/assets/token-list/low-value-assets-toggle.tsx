import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { ASSET_CELL_HEIGHT } from '../constants';
import { useI18nContext } from '../../../../hooks/useI18nContext';

type LowValueAssetsToggleProps = {
  count: number;
  isExpanded: boolean;
  onClick: () => void;
};

export const LowValueAssetsToggle = ({
  count,
  isExpanded,
  onClick,
}: LowValueAssetsToggleProps) => {
  const t = useI18nContext();

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center bg-background-default px-4 text-start text-inherit hover:bg-hover focus:outline-none"
      style={{ height: ASSET_CELL_HEIGHT }}
      aria-expanded={isExpanded}
      data-testid="low-value-assets-toggle"
    >
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        className="min-w-0"
      >
        <Text
          variant={TextVariant.BodyMd}
          fontWeight={FontWeight.Medium}
          color={TextColor.TextAlternative}
          ellipsis
        >
          {t('lowValueAssets', [count])}
        </Text>
        <Box marginLeft={1} className="flex-shrink-0">
          <Icon
            name={isExpanded ? IconName.ArrowUp : IconName.ArrowDown}
            size={IconSize.Sm}
            color={IconColor.IconAlternative}
          />
        </Box>
      </Box>
    </button>
  );
};
