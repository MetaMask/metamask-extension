import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Box from '../../../ui/box';
import {
  AlignItems,
  Color,
  IconColor,
  JustifyContent,
  Size,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import {
  AvatarIcon,
  Icon,
  ICON_NAMES,
  ICON_SIZES,
  Text,
} from '../../../component-library';
import { formatDate } from '../../../../helpers/utils/util';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import Tooltip from '../../../ui/tooltip';

const PermissionCell = ({
  title,
  description,
  weight,
  avatarIcon,
  dateApproved,
  revoked,
}) => {
  const t = useI18nContext();

  let iconColor = Color.primaryDefault;
  let iconBackgroundColor = Color.primaryMuted;
  let infoIconColor = IconColor.iconMuted;
  let infoIcon = ICON_NAMES.INFO;

  if (!revoked && weight === 1) {
    iconColor = Color.warningDefault;
    iconBackgroundColor = Color.warningMuted;
    infoIconColor = IconColor.warningDefault;
    infoIcon = ICON_NAMES.DANGER;
  }

  if (revoked) {
    iconColor = Color.iconMuted;
    iconBackgroundColor = Color.backgroundAlternative;
  }

  return (
    <Box
      className="permission-cell"
      justifyContent={JustifyContent.center}
      alignItems={AlignItems.flexStart}
      marginLeft={4}
      marginRight={4}
      marginTop={2}
      marginBottom={2}
    >
      <Box>
        {typeof avatarIcon === 'string' ? (
          <AvatarIcon
            iconName={avatarIcon}
            size={ICON_SIZES.MD}
            iconProps={{
              size: ICON_SIZES.SM,
            }}
            color={iconColor}
            backgroundColor={iconBackgroundColor}
          />
        ) : (
          avatarIcon
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
        <Text
          size={Size.XS}
          className="permission-cell__status"
          variant={TextVariant.bodyXs}
          color={TextColor.textAlternative}
        >
          {!revoked &&
            (dateApproved
              ? t('approvedOn', [formatDate(dateApproved, 'yyyy-MM-dd')])
              : t('permissionRequested'))}
          {revoked ? t('permissionRevoked') : ''}
        </Text>
      </Box>
      <Box>
        <Tooltip html={<div>{description}</div>} position="bottom">
          <Icon color={infoIconColor} name={infoIcon} size={ICON_SIZES.SM} />
        </Tooltip>
      </Box>
    </Box>
  );
};

PermissionCell.propTypes = {
  title: PropTypes.oneOfType([
    PropTypes.string.isRequired,
    PropTypes.object.isRequired,
  ]),
  description: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  weight: PropTypes.number,
  avatarIcon: PropTypes.any.isRequired,
  dateApproved: PropTypes.number,
  revoked: PropTypes.bool,
};

export default PermissionCell;
