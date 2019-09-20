import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Media from 'react-media'
import { Redirect } from 'react-router-dom'
import { formatDate } from '../../helpers/utils/util'
import HomeNotification from '../../components/app/home-notification'
import MultipleNotifications from '../../components/app/multiple-notifications'
import WalletView from '../../components/app/wallet-view'
import TransactionView from '../../components/app/transaction-view'
import PermissionApproval from '../permission-approval'
import TextField from '../../components/ui/text-field'
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
    activeTab: {},
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
    restoredFromThreeBox: PropTypes.bool,
    selectedAddress: PropTypes.string,
    restoreFromThreeBox: PropTypes.func,
    setRestoredFromThreeBoxToFalse: PropTypes.func,
    threeBoxLastUpdated: PropTypes.string,
    threeBoxFeatureFlagIsTrue: PropTypes.bool,
    permissionsRequests: PropTypes.array,
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
      restoredFromThreeBox,
      threeBoxLastUpdated,
    } = this.props
    if (threeBoxSynced && restoredFromThreeBox === null && threeBoxLastUpdated === null) {
      setupThreeBox()
    }
  }

  render () {
    const { t } = this.context
    const {
      forgottenPassword,
      history,
      shouldShowSeedPhraseReminder,
      isPopup,
      selectedAddress,
      restoreFromThreeBox,
      turnThreeBoxSyncingOn,
      setRestoredFromThreeBoxToFalse,
      restoredFromThreeBox,
      threeBoxLastUpdated,
      threeBoxFeatureFlagIsTrue,
      permissionsRequests,
    } = this.props

    if (forgottenPassword) {
      return <Redirect to={{ pathname: RESTORE_VAULT_ROUTE }} />
    }

    if (permissionsRequests && permissionsRequests.length > 0) {
      return (
        <PermissionApproval permissionsRequests = {permissionsRequests}/>
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
                      shouldBeRendered: threeBoxFeatureFlagIsTrue && threeBoxLastUpdated && restoredFromThreeBox === null,
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
                          setRestoredFromThreeBoxToFalse()
                        }}
                        key="home-privacyModeDefault"
                      />,
                    },
                  ]}/>
                <div>
                  <TextField
                    id="delete-plugin"
                    label={'Delete Plugin'}
                    type="text"
                    value={this.state.pluginToDelete}
                    onChange={e => this.setState({ pluginToDelete: e.target.value })}
                    fullWidth
                    margin="normal"
                  />
                  <Button onClick={() => this.props.deletePlugin(this.state.pluginToDelete)} >{ 'Delete Plugin' }</Button>
                  <Button onClick={() => this.props.clearPluginState()} >{ 'Clear All Plugin State' }</Button>
                </div>
              </TransactionView>
            )
            : null }
        </div>
      </div>
    )
  }
}
