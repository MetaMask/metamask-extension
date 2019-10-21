import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Media from 'react-media'
import { Redirect } from 'react-router-dom'
import { formatDate } from '../../helpers/utils/util'
import HomeNotification from '../../components/app/home-notification'
import MultipleNotifications from '../../components/app/multiple-notifications'
import WalletView from '../../components/app/wallet-view'
import TransactionView from '../../components/app/transaction-view'
import ProviderApproval from '../provider-approval'

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
    unsetMigratedPrivacyMode: null,
  }

  static propTypes = {
    history: PropTypes.object,
    forgottenPassword: PropTypes.bool,
    suggestedTokens: PropTypes.object,
    unconfirmedTransactionsCount: PropTypes.number,
    providerRequests: PropTypes.array,
    showPrivacyModeNotification: PropTypes.bool.isRequired,
    unsetMigratedPrivacyMode: PropTypes.func,
    shouldShowSeedPhraseReminder: PropTypes.bool,
    isPopup: PropTypes.bool,
    threeBoxSynced: PropTypes.bool,
    setupThreeBox: PropTypes.func,
    turnThreeBoxSyncingOn: PropTypes.func,
    showRestorePrompt: PropTypes.bool,
    selectedAddress: PropTypes.string,
    restoreFromThreeBox: PropTypes.func,
    setShowRestorePromptToFalse: PropTypes.func,
    threeBoxLastUpdated: PropTypes.string,
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
      providerRequests,
      history,
      showPrivacyModeNotification,
      unsetMigratedPrivacyMode,
      shouldShowSeedPhraseReminder,
      isPopup,
      selectedAddress,
      restoreFromThreeBox,
      turnThreeBoxSyncingOn,
      setShowRestorePromptToFalse,
      showRestorePrompt,
      threeBoxLastUpdated,
    } = this.props

    if (forgottenPassword) {
      return <Redirect to={{ pathname: RESTORE_VAULT_ROUTE }} />
    }

    if (providerRequests && providerRequests.length > 0) {
      return (
        <ProviderApproval providerRequest={providerRequests[0]} />
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
                <MultipleNotifications
                  className
                  notifications={[
                    {
                      shouldBeRendered: showPrivacyModeNotification,
                      component: <HomeNotification
                        descriptionText={t('privacyModeDefault')}
                        acceptText={t('learnMore')}
                        onAccept={() => {
                          unsetMigratedPrivacyMode()
                          window.open('https://medium.com/metamask/42549d4870fa', '_blank', 'noopener')
                        }}
                        ignoreText={t('dismiss')}
                        onIgnore={() => {
                          unsetMigratedPrivacyMode()
                        }}
                        key="home-privacyModeDefault"
                      />,
                    },
                    {
                      shouldBeRendered: shouldShowSeedPhraseReminder,
                      component: <HomeNotification
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
                      />,
                    },
                    {
                      shouldBeRendered: threeBoxLastUpdated && showRestorePrompt,
                      component: <HomeNotification
                        descriptionText={t('restoreWalletPreferences', [ formatDate(parseInt(threeBoxLastUpdated), 'M/d/y') ])}
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
                      />,
                    },
                  ]}/>
              </TransactionView>
            )
            : null }
        </div>
      </div>
    )
  }
}
