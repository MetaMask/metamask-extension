import PropTypes from 'prop-types';
import React, { Component } from 'react';
import SiteOrigin from '../../ui/site-origin';
///: BEGIN:ONLY_INCLUDE_IN(flask)
import SnapsAuthorshipPill from '../flask/snaps-authorship-pill';
///: END:ONLY_INCLUDE_IN

export default class PermissionsConnectHeader extends Component {
  static propTypes = {
    iconUrl: PropTypes.string,
    iconName: PropTypes.string.isRequired,
    siteOrigin: PropTypes.string.isRequired,
    headerTitle: PropTypes.node,
    headerText: PropTypes.string,
    ///: BEGIN:ONLY_INCLUDE_IN(flask)
    npmPackageName: PropTypes.string,
    ///: END:ONLY_INCLUDE_IN
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
    const {
      headerTitle,
      headerText,
      ///: BEGIN:ONLY_INCLUDE_IN(flask)
      npmPackageName,
      ///: END:ONLY_INCLUDE_IN
    } = this.props;
    ///: BEGIN:ONLY_INCLUDE_IN(flask)
    const npmPackageUrl = `https://www.npmjs.com/package/${npmPackageName}`;
    ///: END:ONLY_INCLUDE_IN
    return (
      <div className="permissions-connect-header">
        {this.renderHeaderIcon()}
        <div className="permissions-connect-header__title">{headerTitle}</div>
        {
          ///: BEGIN:ONLY_INCLUDE_IN(flask)
          npmPackageName ? (
            <SnapsAuthorshipPill
              packageName={npmPackageName}
              url={npmPackageUrl}
            />
          ) : null
          ///: END:ONLY_INCLUDE_IN
        }
        <div className="permissions-connect-header__subtitle">{headerText}</div>
      </div>
    );
  }
}
