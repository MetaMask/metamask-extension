import PropTypes from 'prop-types';
import React, { Component } from 'react';
import SiteOrigin from '../../ui/site-origin';
import Box from '../../ui/box';
import {
  FLEX_DIRECTION,
  JUSTIFY_CONTENT,
} from '../../../helpers/constants/design-system';
///: BEGIN:ONLY_INCLUDE_IN(flask)
import SnapsAuthorshipPill from '../flask/snaps-authorship-pill';
///: END:ONLY_INCLUDE_IN

export default class PermissionsConnectHeader extends Component {
  static propTypes = {
    iconUrl: PropTypes.string,
    iconName: PropTypes.string.isRequired,
    siteOrigin: PropTypes.string.isRequired,
    headerTitle: PropTypes.node,
    boxProps: PropTypes.shape({ ...Box.propTypes }),
    headerText: PropTypes.string,
    ///: BEGIN:ONLY_INCLUDE_IN(flask)
    npmPackageName: PropTypes.string,
    ///: END:ONLY_INCLUDE_IN
  };

  static defaultProps = {
    iconUrl: null,
    headerTitle: '',
    headerText: '',
    boxProps: {},
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
      boxProps,
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
      <Box
        className="permissions-connect-header"
        flexDirection={FLEX_DIRECTION.COLUMN}
        justifyContent={JUSTIFY_CONTENT.CENTER}
        {...boxProps}
      >
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
      </Box>
    );
  }
}
