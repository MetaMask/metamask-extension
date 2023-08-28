import React, { useRef, useState } from 'react';
import {
  AlignItems,
  BlockSize,
  Display,
  FlexDirection,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
} from '../../component-library';
import { Menu, MenuItem } from '../../ui/menu';

export const ConnectionHeader = () => {
  const t = useI18nContext();
  const menuRef = useRef(false);
  const [showConnectionsBox, setShowConnectionsBox] = useState(false);
  return (
    <Box
      className="connection-header"
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      alignItems={AlignItems.center}
    >
      <Text>{t('connections')}</Text>
      <Box
        ref={menuRef}
        display={Display.Flex}
        justifyContent={JustifyContent.flexEnd}
        width={BlockSize.Full}
      >
        <ButtonIcon
          iconName={IconName.MoreVertical}
          data-testid="account-options-menu-button"
          onClick={() => {
            setShowConnectionsBox(true);
          }}
          size={ButtonIconSize.Sm}
        />
      </Box>
      {showConnectionsBox && (
        <Menu
          className="connection-header__menu"
          anchorElement={menuRef.current}
        >
          <MenuItem>
            <Text>All Connected Sites</Text>
          </MenuItem>
        </Menu>
      )}
    </Box>
  );
};
