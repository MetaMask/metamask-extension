import React, { Component } from 'react';
import PropTypes from 'prop-types';
import SiteIcon from '../../ui/site-icon';
import { stripHttpSchemes } from '../../../helpers/utils/util';

export default class ConnectedSitesList extends Component {
  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    connectedDomains: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string,
        icon: PropTypes.string,
        origin: PropTypes.string,
        host: PropTypes.string,
      }),
    ).isRequired,
    onDisconnect: PropTypes.func.isRequired,
    domainHostCount: PropTypes.objectOf(PropTypes.number).isRequired,
  };

  render() {
    const { connectedDomains, onDisconnect } = this.props;
    const { t } = this.context;

    return (
      <main className="connected-sites-list__content-rows">
        {connectedDomains.map((domain) => (
          <div
            key={domain.origin}
            className="connected-sites-list__content-row"
          >
            <div className="connected-sites-list__domain-info">
              <SiteIcon icon={domain.icon} name={domain.name} size={32} />
              <span
                className="connected-sites-list__domain-name"
                title={domain.extensionId || domain.origin}
              >
                {this.getDomainDisplayName(domain)}
              </span>
            </div>
            <i
              className="fas fa-trash-alt connected-sites-list__trash"
              title={t('disconnect')}
              onClick={() => onDisconnect(domain.origin)}
            />
          </div>
        ))}
      </main>
    );
  }

  getDomainDisplayName(domain) {
    if (domain.extensionId) {
      return this.context.t('externalExtension');
    }

    return this.props.domainHostCount[domain.host] > 1
      ? domain.origin
      : stripHttpSchemes(domain.origin);
  }
}
