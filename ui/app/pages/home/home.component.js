import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Media from 'react-media'
import { Redirect } from 'react-router-dom'
import { formatDate } from '../../helpers/utils/util'
import HomeNotification from '../../components/app/home-notification'
import DaiMigrationNotification from '../../components/app/dai-migration-component'
import MultipleNotifications from '../../components/app/multiple-notifications'
import WalletView from '../../components/app/wallet-view'
import TransactionView from '../../components/app/transaction-view'
import PermissionApproval from '../permission-approval'
import Button from '../../components/ui/button'

import {
  RESTORE_VAULT_ROUTE,
  CONFIRM_TRANSACTION_ROUTE,
  CONFIRM_ADD_SUGGESTED_TOKEN_ROUTE,
  INITIALIZE_BACKUP_SEED_PHRASE_ROUTE,
} from '../../helpers/constants/routes'

export default class Home extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
  }

  static defaultProps = {
    hasDaiV1Token: false,
  }

  static propTypes = {
    activeTab: PropTypes.shape({
      origin: PropTypes.string,
      protocol: PropTypes.string,
      title: PropTypes.string,
      url: PropTypes.string,
    }),
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
    permissionsRequests: PropTypes.array,
    removePlugin: PropTypes.func,
    clearPlugins: PropTypes.func,
    clearAllPermissionsData: PropTypes.func,
    hasPermissionsData: PropTypes.bool,
    hasPlugins: PropTypes.bool,
  }

  state = {
    pluginToDelete: '',
  }

  componentWillMount () {
    const {
      history,
      unconfirmedTransactionsCount = 0,
    } = this.props

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

  render () {
    const { t } = this.context
    const {
      forgottenPassword,
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
      permissionsRequests,
      hasPermissionsData,
      hasPlugins,
    } = this.props

    if (forgottenPassword) {
      return <Redirect to={{ pathname: RESTORE_VAULT_ROUTE }} />
    }

    if (permissionsRequests && permissionsRequests.length > 0) {
      return (
        <PermissionApproval permissionsRequests={permissionsRequests}/>
      )
    }

    return (
      <div className="main-container">
        <div className="account-and-transaction-details">
          <Media
            query="(min-width: 576px)"
            render={() => <WalletView />}
          />
          { !history.location.pathname.match(/^\/confirm-transaction/)
            ? (
              <TransactionView>
                <MultipleNotifications>
                  {
                    shouldShowSeedPhraseReminder
                      ? <HomeNotification
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
                      : null
                  }
                  {
                    threeBoxLastUpdated && showRestorePrompt
                      ? <HomeNotification
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
                      : null
                  }
                  {
                    hasDaiV1Token
                      ? <DaiMigrationNotification />
                      : null
                  }
                </MultipleNotifications>
                <div>

                  <Button
                    onClick={() => {
                      this.props.clearPlugins()
                    }}
                    disabled={!hasPlugins}
                  >
                    { 'Delete All Plugins' }
                  </Button>

                  <Button
                    onClick={() => {
                      this.props.clearAllPermissionsData()
                    }}
                    disabled={!hasPermissionsData}
                  >
                    { 'Delete All Permissions' }
                  </Button>
                </div>
              </TransactionView>
            )
            : null }
        </div>
      </div>
    )
  }
}
