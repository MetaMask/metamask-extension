import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import Box from '../../ui/box/box';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { IconName } from '../../component-library/icon/icon.types';
import { ButtonIcon } from '../../component-library/button-icon/button-icon';
import { Text } from '../../component-library/text/text';
import { Modal } from '../../component-library/modal/modal';
import { ModalOverlay } from '../../component-library/modal-overlay/modal-overlay';
import { ModalContent } from '../../component-library/modal-content/modal-content';
import { ModalHeader } from '../../component-library/modal-header/modal-header';
import Menu from '../../ui/menu/menu';
import MenuItem from '../../ui/menu/menu-item';
import {
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { DynamicSnapPermissions } from '../../../../shared/constants/snaps/permissions';
import { revokeDynamicSnapPermissions } from '../../../store/actions';
import { useDispatch } from '../../../store/hooks';

export const PermissionCellOptions = ({
  snapId,
  permissionName,
  description,
}) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const [anchorElement, setAnchorElement] = useState(null);
  const setAnchorRef = useCallback((node) => {
    setAnchorElement(node);
  }, []);
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
    <Box ref={setAnchorRef}>
      <ButtonIcon
        iconName={IconName.MoreVertical}
        ariaLabel={t('options')}
        onClick={handleOpen}
        data-testid={permissionName}
      />
      {showOptions && (
        <Menu anchorElement={anchorElement} onHide={handleClose}>
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
      <Modal isOpen={showDetails} onClose={handleDetailsClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader onClose={handleDetailsClose}>{t('details')}</ModalHeader>
          <Box paddingLeft={4} paddingRight={4}>
            <Text>{description}</Text>
          </Box>
        </ModalContent>
      </Modal>
    </Box>
  );
};

PermissionCellOptions.propTypes = {
  snapId: PropTypes.string.isRequired,
  permissionName: PropTypes.string.isRequired,
  description: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
};
