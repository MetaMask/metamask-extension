const { Component } = require('react')
const { connect } = require('react-redux')
const PropTypes = require('prop-types')
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
  INITIALIZE_BACKUP_PHRASE_ROUTE,
  RESTORE_VAULT_ROUTE,
  CONFIRM_TRANSACTION_ROUTE,
  NOTICE_ROUTE,
} = require('../../routes')

const { unconfirmedTransactionsCountSelector } = require('../../selectors/confirm-transaction')

class Home extends Component {
  componentDidMount () {
    const {
      history,
      unconfirmedTransactionsCount = 0,
    } = this.props

    // unapprovedTxs and unapproved messages
    if (unconfirmedTransactionsCount > 0) {
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
          pathname: INITIALIZE_BACKUP_PHRASE_ROUTE,
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

    // show current view
    switch (currentView.name) {

      case 'accountDetail':
        log.debug('rendering main container')
        return h(MainContainer, {key: 'account-detail'})

      case 'newKeychain':
        log.debug('rendering new keychain screen')
        return h(NewKeyChainScreen, {key: 'new-keychain'})

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
  unconfirmedTransactionsCount: PropTypes.number,
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
    nextUnreadNotice,
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
    nextUnreadNotice,
    lostAccounts,
    frequentRpcList: state.metamask.frequentRpcList || [],
    currentCurrency: state.metamask.currentCurrency,
    isMouseUser: state.appState.isMouseUser,
    isRevealingSeedWords: state.metamask.isRevealingSeedWords,
    Qr: state.appState.Qr,
    welcomeScreenSeen: state.metamask.welcomeScreenSeen,

    // state needed to get account dropdown temporarily rendering from app bar
    selected,
    unconfirmedTransactionsCount: unconfirmedTransactionsCountSelector(state),
  }
}

module.exports = compose(
  withRouter,
  connect(mapStateToProps)
)(Home)
