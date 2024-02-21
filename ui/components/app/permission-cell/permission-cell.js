import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Box from '../../ui/box';
import {
  AlignItems,
  Color,
  IconColor,
  JustifyContent,
  Size,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  AvatarIcon,
  AvatarIconSize,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../component-library';
import { formatDate } from '../../../helpers/utils/util';
import { useI18nContext } from '../../../hooks/useI18nContext';
import Tooltip from '../../ui/tooltip';
import { PermissionCellOptions } from './permission-cell-options';

const PermissionCell = ({
  snapId,
  permissionName,
  title,
  description,
  weight,
  avatarIcon,
  dateApproved,
  revoked,
  showOptions,
  hideStatus,
}) => {
  const t = useI18nContext();

  const infoIcon = IconName.Info;
  let infoIconColor = IconColor.iconMuted;
  let iconColor = IconColor.primaryDefault;
  let iconBackgroundColor = Color.primaryMuted;

  if (!revoked && weight <= 2) {
    iconColor = IconColor.warningDefault;
    iconBackgroundColor = Color.warningMuted;
    infoIconColor = IconColor.warningDefault;
  }

  if (dateApproved) {
    iconColor = IconColor.iconMuted;
    iconBackgroundColor = Color.backgroundAlternative;
  }

  if (revoked) {
    iconColor = IconColor.iconMuted;
    iconBackgroundColor = Color.backgroundAlternative;
  }

  let permissionIcon = avatarIcon;
  if (typeof avatarIcon !== 'string' && avatarIcon?.props?.iconName) {
    permissionIcon = avatarIcon.props.iconName;
  }

  return (
    <Box
      className="permission-cell"
      justifyContent={JustifyContent.center}
      alignItems={AlignItems.flexStart}
      marginLeft={4}
      marginRight={4}
      paddingTop={2}
      paddingBottom={2}
    >
      <Box>
        {typeof permissionIcon === 'string' ? (
          <AvatarIcon
            iconName={permissionIcon}
            size={AvatarIconSize.Md}
            iconProps={{
              size: IconSize.Sm,
            }}
            color={iconColor}
            backgroundColor={iconBackgroundColor}
          />
        ) : (
          permissionIcon
        )}
      </Box>
      <Box width="full" marginLeft={4} marginRight={4}>
        <Text
          size={Size.MD}
          variant={TextVariant.bodyMd}
          className={classnames('permission-cell__title', {
            'permission-cell__title-revoked': revoked,
          })}
        >
          {title}
        </Text>
        {!hideStatus && (
          <Text
            className="permission-cell__status"
            variant={TextVariant.bodySm}
            color={TextColor.textAlternative}
          >
            {!revoked &&
              (dateApproved
                ? t('approvedOn', [formatDate(dateApproved, 'yyyy-MM-dd')])
                : t('permissionRequested'))}
            {revoked ? t('permissionRevoked') : ''}
          </Text>
        )}
      </Box>
      <Box>
        {showOptions && snapId ? (
          <PermissionCellOptions
            snapId={snapId}
            permissionName={permissionName}
            description={description}
          />
        ) : (
          <Tooltip
            html={
              <Text
                variant={TextVariant.bodySm}
                color={TextColor.textAlternative}
              >
                {description}
              </Text>
            }
            position="bottom"
          >
            <Icon color={infoIconColor} name={infoIcon} size={IconSize.Sm} />
          </Tooltip>
        )}
      </Box>
    </Box>
  );
};

PermissionCell.propTypes = {
  snapId: PropTypes.string,
  permissionName: PropTypes.oneOfType([PropTypes.string, PropTypes.element])
    .isRequired,
  title: PropTypes.oneOfType([
    PropTypes.string.isRequired,
    PropTypes.object.isRequired,
  ]),
  description: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  weight: PropTypes.number,
  avatarIcon: PropTypes.any.isRequired,
  dateApproved: PropTypes.number,
  revoked: PropTypes.bool,
  showOptions: PropTypes.bool,
  hideStatus: PropTypes.bool,
};

export default PermissionCell;
