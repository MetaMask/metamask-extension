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
    getOpenMetamaskTabsIds: PropTypes.func.isRequired,
    onDisconnectSite: PropTypes.func.isRequired,
    onGoToSite: PropTypes.func.isRequired,
  }

  state = {
    showOptionsKey: null,
  }

  UNSAFE_componentWillMount () {
    const { getOpenMetamaskTabsIds } = this.props
    getOpenMetamaskTabsIds()
  }

  render () {
    const { connectedDomains, onDisconnectSite, onGoToSite } = this.props
    const { t } = this.context

    return (
      <main className="connected-sites__content-rows">
        { connectedDomains.map((domain) => (
          <div key={domain.key} className="connected-sites__content-row">
            <div className="connected-sites__domain-info">
              <IconWithFallBack icon={domain.icon} name={domain.name} />
              <span className="connected-sites__domain-name" title={domain.extensionId || domain.key}>
                {
                  domain.extensionId
                    ? t('externalExtension')
                    : domain.key
                }
              </span>
            </div>
            <i
              className="fas fa-ellipsis-v connected-sites__options"
              onClick={() => {
                this.setState((prevState) => ({
                  showOptionsKey: prevState.showOptionsKey === domain.key
                    ? null
                    : domain.key,
                }))
              }}
            >
              {
                this.state.showOptionsKey === domain.key
                  ? (
                    <div className="connected-sites-options">
                      <div className="connected-sites-options__row" onClick={() => onDisconnectSite(domain.key, domain.name)}>
                        <i className="fas fa-trash-alt connected-sites-options__row-icon" />
                        <span>Disconnect site</span>
                      </div>
                      <div className="connected-sites-options__row" onClick={() => onGoToSite(domain.key)}>
                        <i className="fas fa-external-link-alt connected-sites-options__row-icon" />
                        <span>Go to {domain.key}</span>
                      </div>
                    </div>
                  )
                  : null
              }
            </i>
          </div>
        )) }
      </main>
    )
  }
}
