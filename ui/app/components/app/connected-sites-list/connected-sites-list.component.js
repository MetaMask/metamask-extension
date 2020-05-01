import React, { Component } from 'react'
import PropTypes from 'prop-types'
import IconWithFallBack from '../../ui/icon-with-fallback'

export default class ConnectedSitesList extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    connectedDomains: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string,
      icon: PropTypes.string,
      key: PropTypes.string,
    })).isRequired,
    onDisconnect: PropTypes.func.isRequired,
  }

  render () {
    const { connectedDomains, onDisconnect } = this.props
    const { t } = this.context

    return (
      <main className="connected-sites-list__content-rows">
        { connectedDomains.map((domain) => (
          <div key={domain.key} className="connected-sites-list__content-row">
            <div className="connected-sites-list__domain-info">
              <IconWithFallBack icon={domain.icon} name={domain.name} />
              <span className="connected-sites-list__domain-name" title={domain.extensionId || domain.key}>
                {
                  domain.extensionId
                    ? t('externalExtension')
                    : domain.key
                }
              </span>
            </div>
            <i
              className="fas fa-trash-alt connected-sites-list__trash"
              title={t('disconnect')}
              onClick={() => onDisconnect(domain.key, domain.name)}
            />
          </div>
        )) }
      </main>
    )
  }
}
