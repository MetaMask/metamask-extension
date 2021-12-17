import PropTypes from 'prop-types';
import React, { Component } from 'react';
import SiteOrigin from '../../ui/site-origin/site-origin';

export default class PermissionsConnectHeader extends Component {
  static propTypes = {
    iconUrl: PropTypes.string,
    iconName: PropTypes.string.isRequired,
    siteOrigin: PropTypes.string.isRequired,
    headerTitle: PropTypes.node,
    headerText: PropTypes.string,
  };

  static defaultProps = {
    iconUrl: null,
    headerTitle: '',
    headerText: '',
  };

  renderHeaderIcon() {
    const { iconUrl, iconName, siteOrigin } = this.props;

    return (
      <div className="permissions-connect-header__icon">
        <SiteOrigin siteOrigin={siteOrigin} iconSrc={iconUrl} name={iconName} />
      </div>
    );
  }

  render() {
    const { headerTitle, headerText } = this.props;
    return (
      <div className="permissions-connect-header">
        {this.renderHeaderIcon()}
        <div className="permissions-connect-header__title">{headerTitle}</div>
        <div className="permissions-connect-header__subtitle">{headerText}</div>
      </div>
    );
  }
}
