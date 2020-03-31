import PropTypes from 'prop-types'
import React, { Component } from 'react'
import ConnectedSitesList from '../../components/app/connected-sites-list'
import Popover from '../../components/ui/popover/popover.component'
import { DEFAULT_ROUTE } from '../../helpers/constants/routes'
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
    disconnectAccount: PropTypes.func.isRequired,
    history: PropTypes.object.isRequired,
    tabToConnect: PropTypes.object,
    legacyExposeAccount: PropTypes.func.isRequired,
  }

  state = {
    sitePendingDisconnect: null,
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
    const { disconnectAccount } = this.props
    const { sitePendingDisconnect } = this.state

    disconnectAccount(sitePendingDisconnect.domainKey)
    this.clearSitePendingDisconnect()
  }

  renderConnectedSites () {
    const { tabToConnect, legacyExposeAccount } = this.props
    const { t } = this.context
    return (
      <>
        <ConnectedSitesList
          onDisconnectSite={this.setSitePendingDisconnect}
        />
        { tabToConnect ? (
          <footer className="connected-sites__add-site-manually">
            <a onClick={legacyExposeAccount}>{ t('connectManually') }</a>
          </footer>
        ) : null }
      </>
    )
  }

  renderDisconnectConfirmation () {
    const { t } = this.context
    return (
      <div className="connected-sites__confirmation">
        <Button type="secondary" onClick={this.clearSitePendingDisconnect}>
          { t('cancel') }
        </Button>
        <Button type="primary" onClick={this.disconnect}>
          { t('disconnect') }
        </Button>
      </div>
    )
  }

  render () {
    const { accountLabel, history } = this.props
    const { t } = this.context
    const { sitePendingDisconnect } = this.state
    return (
      <Popover
        title={
          sitePendingDisconnect
            ? t('disconnectSite', [sitePendingDisconnect.domainName])
            : t('connectedSites')
        }
        subtitle={
          sitePendingDisconnect
            ? t('disconnectAccountConfirmationDescription')
            : t('connectedSitesDescription', [accountLabel])
        }
        onClose={() => history.push(DEFAULT_ROUTE)}
      >
        {
          sitePendingDisconnect
            ? this.renderDisconnectConfirmation()
            : this.renderConnectedSites()
        }
      </Popover>
    )
  }
}
