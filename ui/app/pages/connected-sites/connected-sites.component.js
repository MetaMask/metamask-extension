import PropTypes from 'prop-types'
import React, { Component } from 'react'
import ConnectedSitesList from '../../components/app/connected-sites-list'
import Popover from '../../components/ui/popover/popover.component'
import Button from '../../components/ui/button'

export default class ConnectedSites extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static defaultProps = {
    tabToConnect: null,
  }

  static propTypes = {
    accountLabel: PropTypes.string.isRequired,
    closePopover: PropTypes.func.isRequired,
    connectedDomains: PropTypes.arrayOf(PropTypes.object).isRequired,
    disconnectAllAccounts: PropTypes.func.isRequired,
    disconnectAccount: PropTypes.func.isRequired,
    getOpenMetamaskTabsIds: PropTypes.func.isRequired,
    legacyExposeAccount: PropTypes.func.isRequired,
    permittedAccountsByOrigin: PropTypes.objectOf(
      PropTypes.arrayOf(PropTypes.string),
    ).isRequired,
    tabToConnect: PropTypes.object,
  }

  state = {
    sitePendingDisconnect: null,
  }

  componentDidMount () {
    const { getOpenMetamaskTabsIds } = this.props
    getOpenMetamaskTabsIds()
  }

  setPendingDisconnect = (domainKey, domainName) => {
    this.setState({
      sitePendingDisconnect: {
        domainKey,
        domainName,
      },
    })
  }

  clearPendingDisconnect = () => {
    this.setState({
      sitePendingDisconnect: null,
    })
  }

  disconnectAccount = () => {
    const { disconnectAccount } = this.props
    const { sitePendingDisconnect } = this.state

    disconnectAccount(sitePendingDisconnect.domainKey)
    this.clearPendingDisconnect()
  }

  disconnectAllAccounts = () => {
    const { disconnectAllAccounts } = this.props
    const { sitePendingDisconnect } = this.state

    disconnectAllAccounts(sitePendingDisconnect.domainKey)
    this.clearPendingDisconnect()
  }

  renderConnectedSitesList () {
    return (
      <ConnectedSitesList
        connectedDomains={this.props.connectedDomains}
        onDisconnect={this.setPendingDisconnect}
      />
    )
  }

  renderConnectedSitesPopover () {

    const {
      accountLabel,
      closePopover,
      connectedDomains,
      legacyExposeAccount,
      tabToConnect,
    } = this.props
    const { t } = this.context

    return (
      <Popover
        className="connected-sites"
        title={t('connectedSites')}
        subtitle={connectedDomains.length
          ? t('connectedSitesDescription', [accountLabel])
          : t('connectedSitesEmptyDescription', [accountLabel])
        }
        onClose={closePopover}
        footer={
          tabToConnect
            ? (
              <a
                className="connected-sites__text-button"
                onClick={legacyExposeAccount}
              >
                {t('connectManually')}
              </a>
            )
            : null
        }
        footerClassName="connected-sites__add-site-manually"
      >
        {this.renderConnectedSitesList()}
      </Popover>
    )
  }

  renderDisconnectPopover () {

    const { closePopover, permittedAccountsByOrigin } = this.props
    const { t } = this.context
    const { sitePendingDisconnect: { domainKey, domainName } } = this.state

    const numPermittedAccounts = permittedAccountsByOrigin[domainKey].length

    return (
      <Popover
        className="connected-sites"
        title={t('disconnectPrompt', [domainName])}
        subtitle={t('disconnectAllAccountsConfirmationDescription')}
        onClose={closePopover}
        footer={(
          <>
            <div className="connected-sites__footer-row">
              <Button type="secondary" onClick={this.clearPendingDisconnect}>
                { t('cancel') }
              </Button>
              <Button
                type="primary"
                onClick={this.disconnectAccount}
              >
                { t('disconnect') }
              </Button>
            </div>
              {
                numPermittedAccounts > 1
                  ? (
                    <div className="connected-sites__footer-row">
                      <a
                        className="connected-sites__text-button"
                        onClick={this.disconnectAllAccounts}
                      >
                        {t('disconnectAllAccounts')}
                      </a>
                    </div>
                  )
                  : null
              }
          </>
        )}
        footerClassName="connected-sites__confirmation"
      />
    )
  }

  render () {
    const { sitePendingDisconnect } = this.state
    return (
      sitePendingDisconnect
        ? this.renderDisconnectPopover()
        : this.renderConnectedSitesPopover()
    )
  }
}
