import PropTypes from 'prop-types';
import React, { Component } from 'react';
import classnames from 'classnames';
import SiteOrigin from '../../ui/site-origin';
import Box from '../../ui/box';
import {
  FLEX_DIRECTION,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import SnapsAuthorshipPill from '../snaps-authorship-pill';

export default class PermissionsConnectHeader extends Component {
  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    className: PropTypes.string,
    iconUrl: PropTypes.string,
    iconName: PropTypes.string.isRequired,
    siteOrigin: PropTypes.string.isRequired,
    headerTitle: PropTypes.node,
    boxProps: PropTypes.shape({ ...Box.propTypes }),
    headerText: PropTypes.string,
    leftIcon: PropTypes.node,
    rightIcon: PropTypes.node,
    snapVersion: PropTypes.string,
    isSnapInstallOrUpdate: PropTypes.bool,
  };

  static defaultProps = {
    iconUrl: null,
    headerTitle: '',
    headerText: '',
    boxProps: {},
  };

  renderHeaderIcon() {
    const {
      iconUrl,
      iconName,
      siteOrigin,
      leftIcon,
      rightIcon,
      isSnapInstallOrUpdate,
    } = this.props;

    if (isSnapInstallOrUpdate) {
      return null;
    }

    return (
      <div className="permissions-connect-header__icon">
        <SiteOrigin
          chip
          siteOrigin={siteOrigin}
          iconSrc={iconUrl}
          name={iconName}
          leftIcon={leftIcon}
          rightIcon={rightIcon}
        />
      </div>
    );
  }

  render() {
    const {
      boxProps,
      className,
      headerTitle,
      headerText,
      siteOrigin,
      snapVersion,
      isSnapInstallOrUpdate,
    } = this.props;
    return (
      <Box
        className={classnames('permissions-connect-header', className)}
        flexDirection={FLEX_DIRECTION.COLUMN}
        justifyContent={JustifyContent.center}
        {...boxProps}
      >
        {this.renderHeaderIcon()}
        <div className="permissions-connect-header__title">{headerTitle}</div>
        {isSnapInstallOrUpdate && (
          <SnapsAuthorshipPill snapId={siteOrigin} version={snapVersion} />
        )}
        <div className="permissions-connect-header__subtitle">{headerText}</div>
      </Box>
    );
  }
}
