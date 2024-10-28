import PropTypes from 'prop-types';
import React, { Component } from 'react';
import classnames from 'classnames';
import { SubjectType } from '@metamask/permission-controller';
import SiteOrigin from '../../ui/site-origin';
import Box from '../../ui/box';
import {
  FLEX_DIRECTION,
  JustifyContent,
} from '../../../helpers/constants/design-system';

export default class PermissionsConnectHeader extends Component {
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
    subjectType: PropTypes.string,
  };

  static defaultProps = {
    iconUrl: null,
    headerTitle: '',
    headerText: '',
    boxProps: {},
  };

  renderHeaderIcon() {
    const { iconUrl, iconName, siteOrigin, leftIcon, rightIcon, subjectType } =
      this.props;

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
  }

  render() {
    const { boxProps, className, headerTitle, headerText } = this.props;
    return (
      <Box
        className={classnames('permissions-connect-header', className)}
        flexDirection={FLEX_DIRECTION.COLUMN}
        justifyContent={JustifyContent.center}
        {...boxProps}
      >
        {this.renderHeaderIcon()}
        <div className="permissions-connect-header__title">{headerTitle}</div>
        <div className="permissions-connect-header__subtitle">{headerText}</div>
      </Box>
    );
  }
}
