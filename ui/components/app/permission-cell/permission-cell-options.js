import React, { useState, useRef } from 'react';
import Box from '../../ui/box';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { IconName, ButtonIcon, Text } from '../../component-library';
import { Menu, MenuItem } from '../../ui/menu';
import {
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';

export const PermissionCellOptions = () => {
  const t = useI18nContext();
  const ref = useRef(false);
  const [showOptions, setShowOptions] = useState(false);

  const handleOpen = () => {
    setShowOptions(true);
  };

  const handleClose = () => {
    setShowOptions(false);
  };

  const handleRevokePermission = () => {
    // TODO
  };

  return (
    <Box ref={ref}>
      <ButtonIcon
        iconName={IconName.MoreVertical}
        ariaLabel={t('options')}
        onClick={handleOpen}
      />
      {showOptions && (
        <Menu anchorElement={ref.current} onHide={handleClose}>
          <MenuItem onClick={handleRevokePermission}>
            <Text
              variant={TextVariant.bodySm}
              color={TextColor.errorDefault}
              style={{
                whiteSpace: 'nowrap',
              }}
            >
              {t('revokePermission')}
            </Text>
          </MenuItem>
        </Menu>
      )}
    </Box>
  );
};
