import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import { withRouter, Switch, Route, Redirect } from 'react-router-dom'
import { compose } from 'recompose'
import CreatePasswordScreen from './create-password-screen'
import UniqueImageScreen from './unique-image-screen'
import NoticeScreen from './notice-screen'
import BackupPhraseScreen from './seed-screen'
import ImportAccountScreen from './import-account-screen'
import ImportSeedPhraseScreen from './import-seed-phrase-screen'
import {
  onboardingBuyEthView,
  unMarkPasswordForgotten,
  showModal,
} from '../../../../ui/app/actions'
import {
  DEFAULT_ROUTE,
  WELCOME_ROUTE,
  INITIALIZE_ROUTE,
  INITIALIZE_IMPORT_ACCOUNT_ROUTE,
  INITIALIZE_IMPORT_WITH_SEED_PHRASE_ROUTE,
} from '../../../../ui/app/routes'

class FirstTimeFlow extends Component {

  static propTypes = {
    isInitialized: PropTypes.bool,
    seedWords: PropTypes.string,
    address: PropTypes.string,
    noActiveNotices: PropTypes.bool,
    goToBuyEtherView: PropTypes.func,
    isUnlocked: PropTypes.bool,
    history: PropTypes.object,
    welcomeScreenSeen: PropTypes.bool,
  };

  static defaultProps = {
    isInitialized: false,
    seedWords: '',
    noActiveNotices: false,
  };

  static SCREEN_TYPE = {
    CREATE_PASSWORD: 'create_password',
    IMPORT_ACCOUNT: 'import_account',
    IMPORT_SEED_PHRASE: 'import_seed_phrase',
    UNIQUE_IMAGE: 'unique_image',
    NOTICE: 'notice',
    BACK_UP_PHRASE: 'back_up_phrase',
    CONFIRM_BACK_UP_PHRASE: 'confirm_back_up_phrase',
    LOADING: 'loading',
  };

  constructor (props) {
    super(props)
    this.state = {
      screenType: this.getScreenType(),
    }
  }

  componentDidMount () {
    const { isInitialized, isUnlocked, history } = this.props

    if (isInitialized || isUnlocked) {
      history.push(DEFAULT_ROUTE)
    }
  }

  setScreenType (screenType) {
    this.setState({ screenType })
  }

  getScreenType () {
    const {
      isInitialized,
      seedWords,
      noActiveNotices,
      forgottenPassword,
    } = this.props
    const {SCREEN_TYPE} = FirstTimeFlow

    // return SCREEN_TYPE.NOTICE

    if (forgottenPassword) {
      return SCREEN_TYPE.IMPORT_SEED_PHRASE
    }
    if (!isInitialized) {
      return SCREEN_TYPE.CREATE_PASSWORD
    }

    if (!noActiveNotices) {
      return SCREEN_TYPE.NOTICE
    }

    if (seedWords) {
      return SCREEN_TYPE.BACK_UP_PHRASE
    }
  };

  renderScreen () {
    const {SCREEN_TYPE} = FirstTimeFlow
    const {
      openBuyEtherModal,
      address,
      restoreCreatePasswordScreen,
      forgottenPassword,
      leaveImportSeedScreenState,
    } = this.props

    switch (this.state.screenType) {
      case SCREEN_TYPE.CREATE_PASSWORD:
        return (
          <CreatePasswordScreen
            next={() => this.setScreenType(SCREEN_TYPE.UNIQUE_IMAGE)}
            goToImportAccount={() => this.setScreenType(SCREEN_TYPE.IMPORT_ACCOUNT)}
            goToImportWithSeedPhrase={() => this.setScreenType(SCREEN_TYPE.IMPORT_SEED_PHRASE)}
          />
        )
      case SCREEN_TYPE.IMPORT_ACCOUNT:
        return (
          <ImportAccountScreen
            back={() => this.setScreenType(SCREEN_TYPE.CREATE_PASSWORD)}
            next={() => this.setScreenType(SCREEN_TYPE.NOTICE)}
          />
        )
      case SCREEN_TYPE.IMPORT_SEED_PHRASE:
        return (
          <ImportSeedPhraseScreen
            back={() => {
              leaveImportSeedScreenState()
              this.setScreenType(SCREEN_TYPE.CREATE_PASSWORD)
            }}
            next={() => {
              const newScreenType = forgottenPassword ? null : SCREEN_TYPE.NOTICE
              this.setScreenType(newScreenType)
            }}
          />
        )
      case SCREEN_TYPE.UNIQUE_IMAGE:
        return (
          <UniqueImageScreen
            next={() => this.setScreenType(SCREEN_TYPE.NOTICE)}
          />
        )
      case SCREEN_TYPE.NOTICE:
        return (
          <NoticeScreen
            next={() => this.setScreenType(SCREEN_TYPE.BACK_UP_PHRASE)}
          />
        )
      case SCREEN_TYPE.BACK_UP_PHRASE:
        return (
          <BackupPhraseScreen
            next={() => openBuyEtherModal()}
          />
        )
      default:
        return <noscript />
    }
  }

  render () {
    return this.props.welcomeScreenSeen
      ? (
        <div className="first-time-flow">
          <Switch>
            <Route exact path={INITIALIZE_IMPORT_ACCOUNT_ROUTE} component={ImportAccountScreen} />
            <Route
              exact
              path={INITIALIZE_IMPORT_WITH_SEED_PHRASE_ROUTE}
              component={ImportSeedPhraseScreen}
            />
            <Route exact path={INITIALIZE_ROUTE} component={CreatePasswordScreen} />
          </Switch>
        </div>
      )
      : <Redirect to={WELCOME_ROUTE } />
  }
}

const mapStateToProps = ({ metamask }) => {
  const {
    isInitialized,
    seedWords,
    noActiveNotices,
    selectedAddress,
    forgottenPassword,
    isMascara,
    isUnlocked,
    welcomeScreenSeen,
  } = metamask

  return {
    isMascara,
    isInitialized,
    seedWords,
    noActiveNotices,
    address: selectedAddress,
    forgottenPassword,
    isUnlocked,
    welcomeScreenSeen,
  }
}

const mapDispatchToProps = dispatch => ({
  leaveImportSeedScreenState: () => dispatch(unMarkPasswordForgotten()),
  openBuyEtherModal: () => dispatch(showModal({ name: 'DEPOSIT_ETHER'})),
})

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(FirstTimeFlow)
