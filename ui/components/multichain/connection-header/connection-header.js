import React, { useRef, useState } from 'react';
import {
  AlignItems,
  BlockSize,
  Display,
  FlexDirection,
  JustifyContent,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  ModalFocus,
  Popover,
  PopoverPosition,
  PopoverRole,
  Text,
} from '../../component-library';
import { MenuItem } from '../../ui/menu';

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

      <Popover
        className="connection-header__popover"
        referenceElement={menuRef.current}
        role={PopoverRole.Dialog}
        position={PopoverPosition.Bottom}
        offset={[0, 0]}
        padding={0}
        isOpen={showConnectionsBox}
        isPortal
        preventOverflow
      >
        <ModalFocus restoreFocus initialFocusRef={menuRef.current}>
          <MenuItem className="connection-header__popover-menu">
            <Text variant={TextVariant.bodySm}>All Connected Sites</Text>
          </MenuItem>
        </ModalFocus>
      </Popover>
    </Box>
  );
};
