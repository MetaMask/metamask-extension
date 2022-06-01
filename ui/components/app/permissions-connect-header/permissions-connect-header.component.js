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
  ///: BEGIN:ONLY_INCLUDE_IN(flask)
  static contextTypes = {
    t: PropTypes.func,
  };
  ///: END:ONLY_INCLUDE_IN

  static propTypes = {
    iconUrl: PropTypes.string,
    iconName: PropTypes.string.isRequired,
    siteOrigin: PropTypes.string.isRequired,
    headerTitle: PropTypes.node,
    boxProps: PropTypes.shape({ ...Box.propTypes }),
    headerText: PropTypes.string,
    ///: BEGIN:ONLY_INCLUDE_IN(flask)
    snapVersion: PropTypes.string,
    isSnapInstall: PropTypes.bool,
    ///: END:ONLY_INCLUDE_IN
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
      ///: BEGIN:ONLY_INCLUDE_IN(flask)
      isSnapInstall,
      ///: END:ONLY_INCLUDE_IN
    } = this.props;

    ///: BEGIN:ONLY_INCLUDE_IN(flask)
    if (isSnapInstall) {
      return null;
    }
    ///: END:ONLY_INCLUDE_IN

    return (
      <div className="permissions-connect-header__icon">
        <SiteOrigin
          chip
          siteOrigin={siteOrigin}
          iconSrc={iconUrl}
          name={iconName}
        />
      </div>
    );
  }

  render() {
    const {
      boxProps,
      headerTitle,
      headerText,
      ///: BEGIN:ONLY_INCLUDE_IN(flask)
      siteOrigin,
      snapVersion,
      isSnapInstall,
      ///: END:ONLY_INCLUDE_IN
    } = this.props;
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
          isSnapInstall && (
            <SnapsAuthorshipPill snapId={siteOrigin} version={snapVersion} />
          )
          ///: END:ONLY_INCLUDE_IN
        }
        <div className="permissions-connect-header__subtitle">{headerText}</div>
      </Box>
    );
  }
}
