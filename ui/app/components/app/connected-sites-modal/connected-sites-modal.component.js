import classnames from 'classnames'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import PopOverRoot from '../popover'
import IconWithFallback from '../../ui/icon-with-fallback'
import DisconnectSiteIcon from './icons/disconnect-site'
import GoToSiteIcon from './icons/go-to-site'
import SiteOptionsIcon from './icons/site-options'
import BackIcon from './icons/back'
import CloseIcon from './icons/close'

export default class ConnectedSites extends PureComponent {
  static contextTypes = {
    t: PropTypes.func.isRequired,
  }

  static defaultProps = {
    onBack: null,
  }

  static propTypes = {
    accountName: PropTypes.string.isRequired,
    connectedSites: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string,
      icon: PropTypes.string,
      key: PropTypes.string,
    })).isRequired,
    onAddSite: PropTypes.func,
    onBack: PropTypes.func,
    onClose: PropTypes.func.isRequired,
    onDisconnectSite: PropTypes.func.isRequired,
    onGoToSite: PropTypes.func.isRequired,
  }

  state = {
    showOptionsKey: null,
  }

  render () {
    const { t } = this.context

    const {
      accountName,
      connectedSites,
      onAddSite,
      onBack,
      onClose,
      onDisconnectSite,
      onGoToSite,
    } = this.props

    return (
      <PopOverRoot>
        <section className="connected-sites">
          <header className="connected-sites__header">
            <BackIcon
              className={classnames('connected-sites__back-button', {
                'connected-sites__back-button--hidden': !onBack,
              })}
              onClick={onBack}
            />
            <h1>Connected Sites</h1>
            <CloseIcon onClick={onClose} />
          </header>
          <div className="connected-sites__description">
            <p>
              <strong>{ accountName }</strong> is
              {
                connectedSites.length
                  ? 'connected to these sites. They can view your account address.'
                  : 'not connected to any sites.'
              }
            </p>
          </div>
          <main className="connected-sites__content-rows">
            { connectedSites.map((domain) => (
              <div key={domain.key} className="connected-sites__content-row">
                <div className="connected-sites__domain-info">
                  <IconWithFallback icon={domain.icon} name={domain.name} />
                  <span className="connected-sites__domain-name">
                    {
                      domain.extensionId
                        ? t('externalExtension')
                        : domain.key
                    }
                  </span>
                </div>
                <SiteOptionsIcon
                  className="connected-sites__options"
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
                          <div className="connected-sites-options__row" onClick={() => onDisconnectSite(domain.key)}>
                            <DisconnectSiteIcon className="connected-sites-options__row-icon" />
                            <span>Disconnect site</span>
                          </div>
                          <div className="connected-sites-options__row" onClick={() => onGoToSite(domain.key)}>
                            <GoToSiteIcon className="connected-sites-options__row-icon" />
                            <span>Go to {domain.key}</span>
                          </div>
                        </div>
                      )
                      : null
                  }
                </SiteOptionsIcon>
              </div>
            )) }
          </main>
          { onAddSite ? (
            <footer className="connected-sites__footer">
              <a onClick={onAddSite}>+ Add site manually</a>
            </footer>
          ) : null }
        </section>
      </PopOverRoot>
    )
  }
}
