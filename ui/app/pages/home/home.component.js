import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Media from 'react-media'
import { Redirect, Route } from 'react-router-dom'
import { formatDate } from '../../helpers/utils/util'
import HomeNotification from '../../components/app/home-notification'
import DaiMigrationNotification from '../../components/app/dai-migration-component'
import MultipleNotifications from '../../components/app/multiple-notifications'
import WalletView from '../../components/app/wallet-view'
import TransactionList from '../../components/app/transaction-list'
import TransactionViewBalance from '../../components/app/transaction-view-balance'
import MenuBar from '../../components/app/menu-bar'
import ConnectedSites from '../connected-sites/connected-sites.component'

import {
  RESTORE_VAULT_ROUTE,
  CONFIRM_TRANSACTION_ROUTE,
  CONFIRM_ADD_SUGGESTED_TOKEN_ROUTE,
  INITIALIZE_BACKUP_SEED_PHRASE_ROUTE,
  CONNECT_ROUTE,
  CONNECTED_ROUTE,
} from '../../helpers/constants/routes'

export default class Home extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
  }

  static defaultProps = {
    hasDaiV1Token: false,
  }

  static propTypes = {
    history: PropTypes.object,
    forgottenPassword: PropTypes.bool,
    suggestedTokens: PropTypes.object,
    unconfirmedTransactionsCount: PropTypes.number,
    shouldShowSeedPhraseReminder: PropTypes.bool,
    isPopup: PropTypes.bool,
    threeBoxSynced: PropTypes.bool,
    setupThreeBox: PropTypes.func,
    turnThreeBoxSyncingOn: PropTypes.func,
    showRestorePrompt: PropTypes.bool,
    selectedAddress: PropTypes.string,
    restoreFromThreeBox: PropTypes.func,
    setShowRestorePromptToFalse: PropTypes.func,
    threeBoxLastUpdated: PropTypes.number,
    hasDaiV1Token: PropTypes.bool,
    firstPermissionsRequestId: PropTypes.string,
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
      suggestedTokens = {},
    } = this.props

    // suggested new tokens
    if (Object.keys(suggestedTokens).length > 0) {
      history.push(CONFIRM_ADD_SUGGESTED_TOKEN_ROUTE)
    }
  }

  componentDidUpdate () {
    const {
      threeBoxSynced,
      setupThreeBox,
      showRestorePrompt,
      threeBoxLastUpdated,
    } = this.props
    if (threeBoxSynced && showRestorePrompt && threeBoxLastUpdated === null) {
      setupThreeBox()
    }
  }

  renderNotifications () {
    const { t } = this.context
    const {
      history,
      hasDaiV1Token,
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
        {
          hasDaiV1Token
            ? <DaiMigrationNotification />
            : null
        }
      </MultipleNotifications>
    )
  }

  render () {
    const {
      forgottenPassword,
      history,
    } = this.props

    if (forgottenPassword) {
      return <Redirect to={{ pathname: RESTORE_VAULT_ROUTE }} />
    } else if (history.location.pathname.match(/^\/confirm-transaction/)) {
      // This should only happen if this renders during the redirect to the confirm page
      // Display nothing while the confirm page loads, to avoid side-effects of rendering normal home view
      return null
    }

    return (
      <div className="main-container">
        <Route path={CONNECTED_ROUTE} component={ConnectedSites} />
        <div className="home__container">
          <Media
            query="(min-width: 576px)"
          >
            {
              (isWideViewport) => (
                <>
                  { isWideViewport ? <WalletView /> : null }
                  <div className="home__main-view">
                    {
                      !isWideViewport ? <MenuBar /> : null
                    }
                    <div className="home__balance-wrapper">
                      <TransactionViewBalance />
                    </div>
                    <TransactionList />
                  </div>
                </>
              )
            }
          </Media>
          { this.renderNotifications() }
        </div>
      </div>
    )
  }
}
