import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Button from '../../ui/button';
import { AvatarFavicon, IconSize } from '../../component-library';
import { stripHttpsSchemeWithoutPort } from '../../../helpers/utils/util';
import SiteOrigin from '../../ui/site-origin';
import { Size } from '../../../helpers/constants/design-system';
import { isSnapId } from '../../../helpers/utils/snaps';
import { SnapIcon } from '../snaps/snap-icon';

export default class ConnectedSitesList extends Component {
  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    connectedSubjects: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string,
        iconUrl: PropTypes.string,
        origin: PropTypes.string,
      }),
    ).isRequired,
    onDisconnect: PropTypes.func.isRequired,
    getSnapName: PropTypes.func.isRequired,
  };

  getConnectedSitesListContent = () => {
    const { connectedSubjects, onDisconnect, getSnapName } = this.props;
    const { t } = this.context;
    return connectedSubjects.map((subject) => {
      if (isSnapId(subject.origin)) {
        const snapName = getSnapName(subject.origin);
        return (
          <div
            key={subject.origin}
            className="connected-sites-list__content-row"
          >
            <div className="connected-sites-list__subject-info">
              <SnapIcon avatarSize={IconSize.Md} snapId={subject.origin} />
              <SiteOrigin
                className="connected-sites-list__subject-name"
                title={snapName}
                siteOrigin={snapName}
              />
            </div>
            <Button
              className="connected-sites-list__content-row-link-button"
              onClick={() => onDisconnect(subject.origin)}
              type="link"
            >
              {t('disconnect')}
            </Button>
          </div>
        );
      }
      return (
        <div key={subject.origin} className="connected-sites-list__content-row">
          <div className="connected-sites-list__subject-info">
            <AvatarFavicon
              className="connected-sites-list__subject-icon"
              name={subject.name}
              size={Size.MD}
              src={subject.iconUrl}
            />
            <SiteOrigin
              className="connected-sites-list__subject-name"
              title={subject.extensionId || subject.origin}
              siteOrigin={this.getSubjectDisplayName(subject)}
            />
          </div>
          <Button
            className="connected-sites-list__content-row-link-button"
            onClick={() => onDisconnect(subject.origin)}
            type="link"
          >
            {t('disconnect')}
          </Button>
        </div>
      );
    });
  };

  render() {
    return (
      <main className="connected-sites-list__content-rows">
        {this.getConnectedSitesListContent()}
      </main>
    );
  }

  getSubjectDisplayName(subject) {
    if (subject.extensionId) {
      return this.context.t('externalExtension');
    }

    // We strip https schemes only, and only if the URL has no port.
    return stripHttpsSchemeWithoutPort(subject.origin);
  }
}
