import React, { Component } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import Button from '../../ui/button'

export default class ConnectedSitesList extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    renderableDomains: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string,
      icon: PropTypes.string,
      key: PropTypes.string,
      lastConnectedTime: PropTypes.string,
      permissionDescriptions: PropTypes.array,
    })).isRequired,
    domains: PropTypes.object.isRequired,
  }

  state = {
    expandedDomain: '',
    iconError: '',
  }

  handleDomainItemClick (domainKey) {
    if (this.state.expandedDomain === domainKey) {
      this.setState({ expandedDomain: '' })
    } else {
      this.setState({ expandedDomain: domainKey })
    }
  }

  render () {
    const { renderableDomains, domains, showDisconnectAccountModal, showDisconnectAllModal } = this.props
    const { expandedDomain } = this.state
    const { t } = this.context

    return (
      <div className="connected-sites-list">
        {
          renderableDomains.map((domain, domainIndex) => {
            const domainIsExpanded = expandedDomain === domain.key
            return (
              <div
                className={classnames("connected-sites-list__domain", {
                  'connected-sites-list__domain--expanded': domainIsExpanded,
                })}
                key={`connected-domain-${domainIndex}`}
              >
                <div className="connected-sites-list__domain-item" onClick={ () => this.handleDomainItemClick(domain.key) }>
                  <div className="connected-sites-list__domain-item-info-container">
                    <div className="connected-sites-list__identicon-container">
                      <div className="connected-sites-list__identicon-border" />
                      {!this.state.iconError && domain.icon ? (
                        <img
                          className="connected-sites-list__identicon"
                          src={domain.icon}
                          onError={() => this.setState({ iconError: true })}
                        />
                      ) : (
                        <i className="connected-sites-list__identicon--default">
                          {domain.name.charAt(0).toUpperCase()}
                        </i>
                      )}
                    </div>
                    <div className="connected-sites-list__domain-info">
                      <div className="connected-sites-list__domain-names">
                        <div className="connected-sites-list__domain-name">
                          { domain.name }
                        </div>
                      </div>
                      { domain.lastConnectedTime
                        ? <div className="connected-sites-list__domain-last-connected">
                          { t('domainLastConnect', [domain.lastConnectedTime]) }
                        </div>
                        : null
                      }
                      {domainIsExpanded
                        ? <div className="connected-sites-list__domain-origin">
                          { domain.key }
                        </div>
                        : null
                      }
                    </div>
                  </div>
                  <div className="connected-sites-list__expand-arrow">
                    { domainIsExpanded ? <i className="fa fa-chevron-up fa-sm" /> : <i className="fa fa-chevron-down fa-sm" /> }
                  </div>
                </div>
                { domainIsExpanded
                  ? <div className="connected-sites-list__permissions">
                    <div className="connected-sites-list__permission-list">
                      {
                        domain.permissionDescriptions.map((description, pdIndex) => {
                          return (
                            <div className="connected-sites-list__permission" key={`permissionDescription-${pdIndex}`}>
                              <i className="fa fa-check-square fa-sm" />
                              <div className="connected-sites-list__permission-description">
                                { description }
                              </div>
                            </div>
                          )
                        })
                      }
                    </div>
                    <div
                      className="connected-sites-list__disconnect"
                      onClick={ () => showDisconnectAccountModal(domain.key, domains[domain.key]) }
                    >
                      { t('disconnectAccount') }
                    </div>
                  </div>
                  : null
                }
              </div>
            )
          })
        }
        <div className="connected-sites-list__disconnect-all">
          <Button onClick={showDisconnectAllModal} type="danger" >
            { t('disconnectAll') }
          </Button>
        </div>
      </div>
    )
  }
}
