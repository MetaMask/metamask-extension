import PropTypes from 'prop-types';
import React, { memo } from 'react';
import classnames from 'clsx';
import { SubjectType } from '@metamask/permission-controller';
import SiteOrigin from '../../ui/site-origin';
import Box from '../../ui/box';
import {
  FLEX_DIRECTION,
  JustifyContent,
} from '../../../helpers/constants/design-system';

function PermissionsConnectHeader({
  className,
  iconUrl = null,
  iconName,
  siteOrigin,
  headerTitle = '',
  boxProps = {},
  headerText = '',
  leftIcon,
  rightIcon,
  subjectType,
}) {
  const renderHeaderIcon = () => {
    if (subjectType === SubjectType.Snap) {
      return null;
    }

    return (
      <div className="permissions-connect-header__icon">
        <SiteOrigin
          chip
          siteOrigin={siteOrigin}
          title={siteOrigin}
          iconSrc={iconUrl}
          name={iconName}
          leftIcon={leftIcon}
          rightIcon={rightIcon}
        />
      </div>
    );
  };

  return (
    <Box
      className={classnames('permissions-connect-header', className)}
      flexDirection={FLEX_DIRECTION.COLUMN}
      justifyContent={JustifyContent.center}
      {...boxProps}
    >
      {renderHeaderIcon()}
      <div className="permissions-connect-header__title">{headerTitle}</div>
      <div className="permissions-connect-header__subtitle">{headerText}</div>
    </Box>
  );
}

PermissionsConnectHeader.propTypes = {
  className: PropTypes.string,
  iconUrl: PropTypes.string,
  iconName: PropTypes.string.isRequired,
  siteOrigin: PropTypes.string.isRequired,
  headerTitle: PropTypes.node,
  boxProps: PropTypes.shape({ ...Box.propTypes }),
  headerText: PropTypes.string,
  leftIcon: PropTypes.node,
  rightIcon: PropTypes.node,
  subjectType: PropTypes.string,
};

export default memo(PermissionsConnectHeader);
