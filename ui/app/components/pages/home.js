const { Component } = require('react')
const PropTypes = require('prop-types')
const connect = require('../../metamask-connect')
const { Redirect, withRouter } = require('react-router-dom')
const { compose } = require('recompose')
const h = require('react-hyperscript')
const actions = require('../../actions')
const log = require('loglevel')

// init
const NewKeyChainScreen = require('../../new-keychain')
// mascara
const MascaraBuyEtherScreen = require('../../../../mascara/src/app/first-time/buy-ether-screen').default

// accounts
const MainContainer = require('../../main-container')

// other views
const BuyView = require('../../components/buy-button-subview')
const QrView = require('../../components/qr-code')

// Routes
const {
  REVEAL_SEED_ROUTE,
  RESTORE_VAULT_ROUTE,
  CONFIRM_TRANSACTION_ROUTE,
  NOTICE_ROUTE,
} = require('../../routes')

class Home extends Component {
  componentDidMount () {
    const {
      history,
      unapprovedTxs = {},
      unapprovedMsgCount = 0,
      unapprovedPersonalMsgCount = 0,
      unapprovedTypedMessagesCount = 0,
    } = this.props

    // unapprovedTxs and unapproved messages
    if (Object.keys(unapprovedTxs).length ||
      unapprovedTypedMessagesCount + unapprovedMsgCount + unapprovedPersonalMsgCount > 0) {
      history.push(CONFIRM_TRANSACTION_ROUTE)
    }
  }

  render () {
    log.debug('rendering primary')
    const {
      noActiveNotices,
      lostAccounts,
      forgottenPassword,
      currentView,
      activeAddress,
      seedWords,
    } = this.props

    // notices
    if (!noActiveNotices || (lostAccounts && lostAccounts.length > 0)) {
      return h(Redirect, {
        to: {
          pathname: NOTICE_ROUTE,
        },
      })
    }

    // seed words
    if (seedWords) {
      log.debug('rendering seed words')
      return h(Redirect, {
        to: {
          pathname: REVEAL_SEED_ROUTE,
        },
      })
    }

    if (forgottenPassword) {
      log.debug('rendering restore vault screen')
      return h(Redirect, {
        to: {
          pathname: RESTORE_VAULT_ROUTE,
        },
      })
    }

    // if (!props.noActiveNotices) {
    //   log.debug('rendering notice screen for unread notices.')
    //   return h(NoticeScreen, {
    //     notice: props.lastUnreadNotice,
    //     key: 'NoticeScreen',
    //     onConfirm: () => props.dispatch(actions.markNoticeRead(props.lastUnreadNotice)),
    //   })
    // } else if (props.lostAccounts && props.lostAccounts.length > 0) {
    //   log.debug('rendering notice screen for lost accounts view.')
    //   return h(NoticeScreen, {
    //     notice: generateLostAccountsNotice(props.lostAccounts),
    //     key: 'LostAccountsNotice',
    //     onConfirm: () => props.dispatch(actions.markAccountsFound()),
    //   })
    // }

    // if (props.seedWords) {
    //   log.debug('rendering seed words')
    //   return h(HDCreateVaultComplete, {key: 'HDCreateVaultComplete'})
    // }

    // show initialize screen
    // if (!isInitialized || forgottenPassword) {
    //   // show current view
    //   log.debug('rendering an initialize screen')
    //   // switch (props.currentView.name) {

    //     // case 'restoreVault':
    //     //   log.debug('rendering restore vault screen')
    //     //   return h(HDRestoreVaultScreen, {key: 'HDRestoreVaultScreen'})

    //   //   default:
    //   //     log.debug('rendering menu screen')
    //   //     return h(InitializeScreen, {key: 'menuScreenInit'})
    //   // }
    // }

    // // show unlock screen
    // if (!props.isUnlocked) {
    //   return h(MainContainer, {
    //     currentViewName: props.currentView.name,
    //     isUnlocked: props.isUnlocked,
    //   })
    // }

    // show current view
    switch (currentView.name) {

      case 'accountDetail':
        log.debug('rendering main container')
        return h(MainContainer, {key: 'account-detail'})

      // case 'sendTransaction':
      //   log.debug('rendering send tx screen')

      //   // Going to leave this here until we are ready to delete SendTransactionScreen v1
      //   // const SendComponentToRender = checkFeatureToggle('send-v2')
      //   //   ? SendTransactionScreen2
      //   //   : SendTransactionScreen

      //   return h(SendTransactionScreen2, {key: 'send-transaction'})

      // case 'sendToken':
      //   log.debug('rendering send token screen')

      //   // Going to leave this here until we are ready to delete SendTransactionScreen v1
      //   // const SendTokenComponentToRender = checkFeatureToggle('send-v2')
      //   //   ? SendTransactionScreen2
      //   //   : SendTokenScreen

      //   return h(SendTransactionScreen2, {key: 'sendToken'})

      case 'newKeychain':
        log.debug('rendering new keychain screen')
        return h(NewKeyChainScreen, {key: 'new-keychain'})

      // case 'confTx':
      //   log.debug('rendering confirm tx screen')
      //   return h(Redirect, {
      //     to: {
      //       pathname: CONFIRM_TRANSACTION_ROUTE,
      //     },
      //   })
        // return h(ConfirmTxScreen, {key: 'confirm-tx'})

      // case 'add-token':
      //   log.debug('rendering add-token screen from unlock screen.')
      //   return h(AddTokenScreen, {key: 'add-token'})

      // case 'config':
      //   log.debug('rendering config screen')
      //   return h(Settings, {key: 'config'})

      // case 'import-menu':
      //   log.debug('rendering import screen')
      //   return h(Import, {key: 'import-menu'})

      // case 'reveal-seed-conf':
      //   log.debug('rendering reveal seed confirmation screen')
      //   return h(RevealSeedConfirmation, {key: 'reveal-seed-conf'})

      // case 'info':
      //   log.debug('rendering info screen')
      //   return h(Settings, {key: 'info', tab: 'info'})

      case 'buyEth':
        log.debug('rendering buy ether screen')
        return h(BuyView, {key: 'buyEthView'})

      case 'onboardingBuyEth':
        log.debug('rendering onboarding buy ether screen')
        return h(MascaraBuyEtherScreen, {key: 'buyEthView'})

      case 'qr':
        log.debug('rendering show qr screen')
        return h('div', {
          style: {
            position: 'absolute',
            height: '100%',
            top: '0px',
            left: '0px',
          },
        }, [
          h('i.fa.fa-arrow-left.fa-lg.cursor-pointer.color-orange', {
            onClick: () => this.props.dispatch(actions.backToAccountDetail(activeAddress)),
            style: {
              marginLeft: '10px',
              marginTop: '50px',
            },
          }),
          h('div', {
            style: {
              position: 'absolute',
              left: '44px',
              width: '285px',
            },
          }, [
            h(QrView, {key: 'qr'}),
          ]),
        ])

      default:
        log.debug('rendering default, account detail screen')
        return h(MainContainer, {key: 'account-detail'})
    }
  }
}

Home.propTypes = {
  currentCurrency: PropTypes.string,
  isLoading: PropTypes.bool,
  loadingMessage: PropTypes.string,
  network: PropTypes.string,
  provider: PropTypes.object,
  frequentRpcList: PropTypes.array,
  currentView: PropTypes.object,
  sidebarOpen: PropTypes.bool,
  isMascara: PropTypes.bool,
  isOnboarding: PropTypes.bool,
  isUnlocked: PropTypes.bool,
  networkDropdownOpen: PropTypes.bool,
  history: PropTypes.object,
  dispatch: PropTypes.func,
  selectedAddress: PropTypes.string,
  noActiveNotices: PropTypes.bool,
  lostAccounts: PropTypes.array,
  isInitialized: PropTypes.bool,
  forgottenPassword: PropTypes.bool,
  activeAddress: PropTypes.string,
  unapprovedTxs: PropTypes.object,
  seedWords: PropTypes.string,
  unapprovedMsgCount: PropTypes.number,
  unapprovedPersonalMsgCount: PropTypes.number,
  unapprovedTypedMessagesCount: PropTypes.number,
  welcomeScreenSeen: PropTypes.bool,
  isPopup: PropTypes.bool,
  isMouseUser: PropTypes.bool,
  t: PropTypes.func,
}

function mapStateToProps (state) {
  const { appState, metamask } = state
  const {
    networkDropdownOpen,
    sidebarOpen,
    isLoading,
    loadingMessage,
  } = appState

  const {
    accounts,
    address,
    isInitialized,
    noActiveNotices,
    seedWords,
    unapprovedTxs,
    lastUnreadNotice,
    lostAccounts,
    unapprovedMsgCount,
    unapprovedPersonalMsgCount,
    unapprovedTypedMessagesCount,
  } = metamask
  const selected = address || Object.keys(accounts)[0]

  return {
    // state from plugin
    networkDropdownOpen,
    sidebarOpen,
    isLoading,
    loadingMessage,
    noActiveNotices,
    isInitialized,
    isUnlocked: state.metamask.isUnlocked,
    selectedAddress: state.metamask.selectedAddress,
    currentView: state.appState.currentView,
    activeAddress: state.appState.activeAddress,
    transForward: state.appState.transForward,
    isMascara: state.metamask.isMascara,
    isOnboarding: Boolean(!noActiveNotices || seedWords || !isInitialized),
    isPopup: state.metamask.isPopup,
    seedWords: state.metamask.seedWords,
    unapprovedTxs,
    unapprovedMsgs: state.metamask.unapprovedMsgs,
    unapprovedMsgCount,
    unapprovedPersonalMsgCount,
    unapprovedTypedMessagesCount,
    menuOpen: state.appState.menuOpen,
    network: state.metamask.network,
    provider: state.metamask.provider,
    forgottenPassword: state.appState.forgottenPassword,
    lastUnreadNotice,
    lostAccounts,
    frequentRpcList: state.metamask.frequentRpcList || [],
    currentCurrency: state.metamask.currentCurrency,
    isMouseUser: state.appState.isMouseUser,
    isRevealingSeedWords: state.metamask.isRevealingSeedWords,
    Qr: state.appState.Qr,
    welcomeScreenSeen: state.metamask.welcomeScreenSeen,

    // state needed to get account dropdown temporarily rendering from app bar
    selected,
  }
}

module.exports = compose(
  withRouter,
  connect(mapStateToProps)
)(Home)
