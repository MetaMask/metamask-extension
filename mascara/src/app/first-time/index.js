import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import CreatePasswordScreen from './create-password-screen'
import UniqueImageScreen from './unique-image-screen'
import NoticeScreen from './notice-screen'
import BackupPhraseScreen from './backup-phrase-screen'
import ImportAccountScreen from './import-account-screen'
import ImportSeedPhraseScreen from './import-seed-phrase-screen'
import {onboardingBuyEthView} from '../../../../ui/app/actions'

class FirstTimeFlow extends Component {

  static propTypes = {
    isInitialized: PropTypes.bool,
    seedWords: PropTypes.string,
    address: PropTypes.string,
    noActiveNotices: PropTypes.bool,
    goToBuyEtherView: PropTypes.func.isRequired,
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
  };

  constructor (props) {
    super(props)
    this.state = {
      screenType: this.getScreenType(),
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
    } = this.props
    const {SCREEN_TYPE} = FirstTimeFlow

    // return SCREEN_TYPE.NOTICE

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
    const {goToBuyEtherView, address} = this.props

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
            back={() => this.setScreenType(SCREEN_TYPE.CREATE_PASSWORD)}
            next={() => this.setScreenType(SCREEN_TYPE.NOTICE)}
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
            next={() => goToBuyEtherView(address)}
          />
        )
      default:
        return <noscript />
    }
  }

  render () {
    return (
      <div className="first-time-flow">
        {this.renderScreen()}
      </div>
    )
  }

}

export default connect(
  ({ metamask: { isInitialized, seedWords, noActiveNotices, selectedAddress } }) => ({
    isInitialized,
    seedWords,
    noActiveNotices,
    address: selectedAddress,
  }),
  dispatch => ({
    goToBuyEtherView: address => dispatch(onboardingBuyEthView(address)),
  })
)(FirstTimeFlow)

