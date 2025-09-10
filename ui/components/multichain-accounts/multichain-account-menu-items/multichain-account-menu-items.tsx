import React, { useMemo } from 'react';
import classnames from 'classnames';
import { Box, Icon, IconSize, Text } from '../../component-library';
import {
  AlignItems,
  Display,
  FontWeight,
  JustifyContent,
  TextVariant,
} from '../../../helpers/constants/design-system';
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
            className={classnames('multichain-account-cell-menu-item', {
              'multichain-account-cell-menu-item--with-border': !isLast,
              'multichain-account-cell-menu-item--disabled': isDisabled,
              'multichain-account-cell-menu-item--enabled': !isDisabled,
            })}
            paddingLeft={8}
            paddingRight={4}
            paddingTop={3}
            paddingBottom={3}
            display={Display.Flex}
            justifyContent={JustifyContent.spaceBetween}
            alignItems={AlignItems.center}
            onClick={item.onClick}
          >
            <Text
              fontWeight={FontWeight.Medium}
              variant={TextVariant.bodyMdMedium}
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
