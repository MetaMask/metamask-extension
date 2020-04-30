import PropTypes from 'prop-types'
import React, { Component } from 'react'
import ConnectedSitesList from '../../components/app/connected-sites-list'
import Popover from '../../components/ui/popover/popover.component'
import Button from '../../components/ui/button'

export default class ConnectSites extends Component {
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
    disconnectSite: PropTypes.func.isRequired,
    tabToConnect: PropTypes.object,
    legacyExposeAccount: PropTypes.func.isRequired,
    getOpenMetamaskTabsIds: PropTypes.func.isRequired,
  }

  state = {
    sitePendingDisconnect: null,
  }

  UNSAFE_componentWillMount () {
    const { getOpenMetamaskTabsIds } = this.props
    getOpenMetamaskTabsIds()
  }

  setSitePendingDisconnect = (domainKey, domainName) => {
    this.setState({
      sitePendingDisconnect: {
        domainKey,
        domainName,
      },
    })
  }

  clearSitePendingDisconnect = () => {
    this.setState({
      sitePendingDisconnect: null,
    })
  }

  disconnect = () => {
    const { disconnectSite } = this.props
    const { sitePendingDisconnect } = this.state

    disconnectSite(sitePendingDisconnect.domainKey)
    this.clearSitePendingDisconnect()
  }

  renderConnectedSites () {
    return (
      <ConnectedSitesList
        connectedDomains={this.props.connectedDomains}
        onDisconnectSite={this.setSitePendingDisconnect}
      />
    )
  }

  render () {
    const { accountLabel, closePopover, connectedDomains, legacyExposeAccount, tabToConnect } = this.props
    const { t } = this.context
    const { sitePendingDisconnect } = this.state
    return (
      sitePendingDisconnect
        ? (
          <Popover
            title={t('disconnectSite', [sitePendingDisconnect.domainName])}
            subtitle={t('disconnectSiteConfirmationDescription')}
            onClose={closePopover}
            footer={(
              <>
                <Button type="secondary" onClick={this.clearSitePendingDisconnect}>
                  { t('cancel') }
                </Button>
                <Button type="primary" onClick={this.disconnect}>
                  { t('disconnect') }
                </Button>
              </>
            )}
            footerClassName="connected-sites__confirmation"
          />
        )
        : (
          <Popover
            title={t('connectedSites')}
            subtitle={connectedDomains.length
              ? t('connectedSitesDescription', [accountLabel])
              : t('connectedSitesEmptyDescription', [accountLabel])
            }
            onClose={closePopover}
            footer={
              tabToConnect
                ? (
                  <a onClick={legacyExposeAccount}>{ t('connectManually') }</a>
                )
                : null
            }
            footerClassName="connected-sites__add-site-manually"
          >
            {this.renderConnectedSites()}
          </Popover>
        )
    )
  }
}
