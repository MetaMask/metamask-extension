import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Button from '../../ui/button';
import { AvatarFavicon, TagUrl } from '../../component-library';
import { stripHttpsSchemeWithoutPort } from '../../../helpers/utils/util';
import { Size } from '../../../helpers/constants/design-system';

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
  };

  render() {
    const { connectedSubjects, onDisconnect } = this.props;
    const { t } = this.context;

    return (
      <main className="connected-sites-list__content-rows">
        {connectedSubjects.map((subject) => (
          <div
            key={subject.origin}
            className="connected-sites-list__content-row"
          >
            <div className="connected-sites-list__subject-info">
              <AvatarFavicon
                className="connected-sites-list__subject-icon"
                name={subject.name}
                size={Size.MD}
                src={subject.iconUrl}
              />
              <TagUrl
                className="connected-sites-list__subject-name"
                label={this.getSubjectDisplayName(subject)}
                title={subject.extensionId || subject.origin}
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
        ))}
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
