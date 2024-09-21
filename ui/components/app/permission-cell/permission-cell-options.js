import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import Box from '../../ui/box';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { IconName, ButtonIcon, Text } from '../../component-library';
import { Menu, MenuItem } from '../../ui/menu';
import {
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import Popover from '../../ui/popover/popover.component';
import { DynamicSnapPermissions } from '../../../../shared/constants/snaps/permissions';
import { revokeDynamicSnapPermissions } from '../../../store/actions';

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
