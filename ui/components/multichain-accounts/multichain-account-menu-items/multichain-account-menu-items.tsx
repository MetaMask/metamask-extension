import React, { useMemo } from 'react';
import classnames from 'clsx';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  FontWeight,
  Icon,
  IconSize,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MultichainAccountMenuItemsProps } from './multichain-account-menu-items.types';

export const MultichainAccountMenuItems = ({
  menuConfig,
}: MultichainAccountMenuItemsProps) => {
  const t = useI18nContext();

  const menuItems = useMemo(() => {
    return menuConfig.map((item, index, menuConfigurations) => {
      const isLast = index === menuConfigurations.length - 1;
      const isDisabled = Boolean(item.disabled);

      return (
        !isDisabled && (
          <Box
            key={item.textKey}
            data-testid={`multichain-account-menu-item-${item.textKey}`}
            className={classnames('multichain-account-cell-menu-item', {
              'multichain-account-cell-menu-item--with-border': !isLast,
              'multichain-account-cell-menu-item--disabled': isDisabled,
              'multichain-account-cell-menu-item--enabled': !isDisabled,
            })}
            paddingLeft={4}
            paddingRight={4}
            paddingTop={3}
            paddingBottom={3}
            flexDirection={BoxFlexDirection.Row}
            justifyContent={BoxJustifyContent.Between}
            alignItems={BoxAlignItems.Center}
            onClick={item.onClick}
            aria-label={t(item.textKey)}
          >
            <Text
              fontWeight={FontWeight.Medium}
              variant={TextVariant.BodyMd}
              color={item.textColor}
            >
              {t(item.textKey)}
            </Text>
            <Icon name={item.iconName} size={IconSize.Md} />
          </Box>
        )
      );
    });
  }, [menuConfig, t]);

  return <>{menuItems}</>;
};
