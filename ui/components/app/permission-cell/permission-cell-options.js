import PropTypes from 'prop-types';
import React, { useState, useRef } from 'react';
import { useDispatch } from 'react-redux';

import { DynamicSnapPermissions } from '../../../../shared/constants/snaps/permissions';
import {
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { revokeDynamicSnapPermissions } from '../../../store/actions';
import { IconName, ButtonIcon, Text } from '../../component-library';
import Box from '../../ui/box';
import { Menu, MenuItem } from '../../ui/menu';
import Popover from '../../ui/popover/popover.component';

export const PermissionCellOptions = ({
  snapId,
  permissionName,
  description,
}) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const ref = useRef(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const isRevokable = DynamicSnapPermissions.includes(permissionName);

  const handleOpen = () => {
    setShowOptions(true);
  };

  const handleClose = () => {
    setShowOptions(false);
  };

  const handleDetailsOpen = () => {
    setShowOptions(false);
    setShowDetails(true);
  };

  const handleDetailsClose = () => {
    setShowOptions(false);
    setShowDetails(false);
  };

  const handleRevokePermission = () => {
    setShowOptions(false);
    dispatch(revokeDynamicSnapPermissions(snapId, [permissionName]));
  };

  if (!description && !isRevokable) {
    return null;
  }

  return (
    <Box ref={ref}>
      <ButtonIcon
        iconName={IconName.MoreVertical}
        ariaLabel={t('options')}
        onClick={handleOpen}
        data-testid={permissionName}
      />
      {showOptions && (
        <Menu anchorElement={ref.current} onHide={handleClose}>
          {description && (
            <MenuItem onClick={handleDetailsOpen}>
              <Text
                variant={TextVariant.bodySm}
                style={{
                  whiteSpace: 'nowrap',
                }}
              >
                {t('details')}
              </Text>
            </MenuItem>
          )}
          {isRevokable && (
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
          )}
        </Menu>
      )}
      {showDetails && (
        <Popover title={t('details')} onClose={handleDetailsClose}>
          <Box marginLeft={4} marginRight={4} marginBottom={4}>
            <Text>{description}</Text>
          </Box>
        </Popover>
      )}
    </Box>
  );
};

PermissionCellOptions.propTypes = {
  snapId: PropTypes.string.isRequired,
  permissionName: PropTypes.string.isRequired,
  description: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
};
