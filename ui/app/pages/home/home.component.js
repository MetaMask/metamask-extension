import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Media from 'react-media'
import { Redirect, Route } from 'react-router-dom'
import { formatDate } from '../../helpers/utils/util'
import AssetList from '../../components/app/asset-list'
import HomeNotification from '../../components/app/home-notification'
import MultipleNotifications from '../../components/app/multiple-notifications'
import WalletView from '../../components/app/wallet-view'
import TransactionList from '../../components/app/transaction-list'
import MenuBar from '../../components/app/menu-bar'
import Popover from '../../components/ui/popover'
import Button from '../../components/ui/button'
import ConnectedSites from '../connected-sites'
import ConnectedAccounts from '../connected-accounts'
import { Tabs, Tab } from '../../components/ui/tabs'
import { EthOverview, TokenOverview } from '../../components/app/wallet-overview'

import {
  RESTORE_VAULT_ROUTE,
  CONFIRM_TRANSACTION_ROUTE,
  CONFIRM_ADD_SUGGESTED_TOKEN_ROUTE,
  INITIALIZE_BACKUP_SEED_PHRASE_ROUTE,
  CONNECT_ROUTE,
  CONNECTED_ROUTE,
  CONNECTED_ACCOUNTS_ROUTE,
} from '../../helpers/constants/routes'

export default class Home extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    history: PropTypes.object,
    forgottenPassword: PropTypes.bool,
    suggestedTokens: PropTypes.object,
    unconfirmedTransactionsCount: PropTypes.number,
    shouldShowSeedPhraseReminder: PropTypes.bool,
    isPopup: PropTypes.bool,
    isNotification: PropTypes.bool.isRequired,
    threeBoxSynced: PropTypes.bool,
    setupThreeBox: PropTypes.func,
    turnThreeBoxSyncingOn: PropTypes.func,
    showRestorePrompt: PropTypes.bool,
    selectedAddress: PropTypes.string,
    restoreFromThreeBox: PropTypes.func,
    setShowRestorePromptToFalse: PropTypes.func,
    threeBoxLastUpdated: PropTypes.number,
    firstPermissionsRequestId: PropTypes.string,
    totalUnapprovedCount: PropTypes.number.isRequired,
    setConnectedStatusPopoverHasBeenShown: PropTypes.func,
    connectedStatusPopoverHasBeenShown: PropTypes.bool,
    selectedToken: PropTypes.shape({
      address: PropTypes.string.isRequired,
      decimals: PropTypes.number,
      symbol: PropTypes.string,
    }),
  }

  UNSAFE_componentWillMount () {
    const {
      history,
      unconfirmedTransactionsCount = 0,
      firstPermissionsRequestId,
    } = this.props

    if (firstPermissionsRequestId) {
      history.push(`${CONNECT_ROUTE}/${firstPermissionsRequestId}`)
    }

    if (unconfirmedTransactionsCount > 0) {
      history.push(CONFIRM_TRANSACTION_ROUTE)
    }
  }

  componentDidMount () {
    const {
      history,
      isNotification,
      suggestedTokens = {},
      totalUnapprovedCount,
    } = this.props

    if (isNotification && totalUnapprovedCount === 0) {
      global.platform.closeCurrentWindow()
    }

    // suggested new tokens
    if (Object.keys(suggestedTokens).length > 0) {
      history.push(CONFIRM_ADD_SUGGESTED_TOKEN_ROUTE)
    }
  }

  componentDidUpdate () {
    const {
      isNotification,
      setupThreeBox,
      showRestorePrompt,
      threeBoxLastUpdated,
      threeBoxSynced,
      totalUnapprovedCount,
    } = this.props

    if (isNotification && totalUnapprovedCount === 0) {
      global.platform.closeCurrentWindow()
    }

    if (threeBoxSynced && showRestorePrompt && threeBoxLastUpdated === null) {
      setupThreeBox()
    }
  }

  renderNotifications () {
    const { t } = this.context
    const {
      history,
      shouldShowSeedPhraseReminder,
      isPopup,
      selectedAddress,
      restoreFromThreeBox,
      turnThreeBoxSyncingOn,
      setShowRestorePromptToFalse,
      showRestorePrompt,
      threeBoxLastUpdated,
    } = this.props

    return (
      <MultipleNotifications>
        {
          shouldShowSeedPhraseReminder
            ? (
              <HomeNotification
                descriptionText={t('backupApprovalNotice')}
                acceptText={t('backupNow')}
                onAccept={() => {
                  if (isPopup) {
                    global.platform.openExtensionInBrowser(INITIALIZE_BACKUP_SEED_PHRASE_ROUTE)
                  } else {
                    history.push(INITIALIZE_BACKUP_SEED_PHRASE_ROUTE)
                  }
                }}
                infoText={t('backupApprovalInfo')}
                key="home-backupApprovalNotice"
              />
            )
            : null
        }
        {
          threeBoxLastUpdated && showRestorePrompt
            ? (
              <HomeNotification
                descriptionText={t('restoreWalletPreferences', [ formatDate(threeBoxLastUpdated, 'M/d/y') ])}
                acceptText={t('restore')}
                ignoreText={t('noThanks')}
                infoText={t('dataBackupFoundInfo')}
                onAccept={() => {
                  restoreFromThreeBox(selectedAddress)
                    .then(() => {
                      turnThreeBoxSyncingOn()
                    })
                }}
                onIgnore={() => {
                  setShowRestorePromptToFalse()
                }}
                key="home-privacyModeDefault"
              />
            )
            : null
        }
      </MultipleNotifications>
    )
  }
  renderPopover = () => {
    const { setConnectedStatusPopoverHasBeenShown } = this.props
    const { t } = this.context
    return (
      <Popover
        title={ t('whatsThis') }
        onClose={setConnectedStatusPopoverHasBeenShown}
        className="home__connected-status-popover"
        showArrow
        CustomBackground={({ onClose }) => {
          return (
            <div
              className="home__connected-status-popover-bg-container"
              onClick={onClose}
            >
              <div className="home__connected-status-popover-bg" />
            </div>
          )
        }}
        footer={(
          <Button
            type="primary"
            onClick={setConnectedStatusPopoverHasBeenShown}
          >
            { t('dismiss') }
          </Button>
        )}
      >
        <main className="home__connect-status-text">
          <div>{ t('metaMaskConnectStatusParagraphOne') }</div>
          <div>{ t('metaMaskConnectStatusParagraphTwo') }</div>
        </main>
      </Popover>
    )
  }

  render () {
    const {
      forgottenPassword,
      history,
      connectedStatusPopoverHasBeenShown,
      isPopup,
      selectedToken,
    } = this.props

    if (forgottenPassword) {
      return <Redirect to={{ pathname: RESTORE_VAULT_ROUTE }} />
    } else if (history.location.pathname.match(/^\/confirm-transaction/)) {
      // This should only happen if this renders during the redirect to the confirm page
      // Display nothing while the confirm page loads, to avoid side-effects of rendering normal home view
      return null
    }

    const homeOverview = selectedToken
      ? <TokenOverview token={selectedToken} />
      : <EthOverview />

    return (
      <div className="main-container">
        <Route path={CONNECTED_ROUTE} component={ConnectedSites} exact />
        <Route path={CONNECTED_ACCOUNTS_ROUTE} component={ConnectedAccounts} exact />
        <div className="home__container">
          { isPopup && !connectedStatusPopoverHasBeenShown ? this.renderPopover() : null }
          <Media
            query="(min-width: 576px)"
          >
            {
              (isWideViewport) => (
                isWideViewport
                  ? (
                    <>
                      <WalletView />
                      <div className="home__main-view">
                        <div className="home__balance-wrapper">
                          { homeOverview }
                        </div>
                        <TransactionList isWideViewport />
                      </div>
                    </>
                  )
                  : (
                    <div className="home__main-view">
                      <MenuBar />
                      <div className="home__balance-wrapper">
                        { homeOverview }
                      </div>
                      <Tabs>
                        <Tab
                          activeClassName="home__tab--active"
                          className="home__tab"
                          data-testid="home__asset-tab"
                          name="Assets"
                        >
                          <AssetList />
                        </Tab>
                        <Tab
                          activeClassName="home__tab--active"
                          className="home__tab"
                          data-testid="home__history-tab"
                          name="History"
                        >
                          <TransactionList />
                        </Tab>
                      </Tabs>
                    </div>
                  )
              )
            }
          </Media>
          { this.renderNotifications() }
        </div>
      </div>
    )
  }
}
