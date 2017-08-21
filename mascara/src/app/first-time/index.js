import React, {Component, PropTypes} from 'react'
import {connect} from 'react-redux';
import CreatePasswordScreen from './create-password-screen'
import UniqueImageScreen from './unique-image-screen'

class FirstTimeFlow extends Component {

  static propTypes = {
    isInitialized: PropTypes.bool,
    seedWords: PropTypes.string,
    noActiveNotices: PropTypes.bool
  };

  static defaultProps = {
    isInitialized: false,
    seedWords: '',
    noActiveNotices: false
  };

  static SCREEN_TYPE = {
    CREATE_PASSWORD: 'create_password',
    UNIQUE_IMAGE: 'unique_image',
    TERM_OF_USE: 'term_of_use',
    BACK_UP_PHRASE: 'back_up_phrase',
    CONFIRM_BACK_UP_PHRASE: 'confirm_back_up_phrase',
    BUY_ETHER: 'buy_ether'
  };

  constructor(props) {
    super(props);
    this.state = {
      screenType: this.getScreenType()
    }
  }

  setScreenType(screenType) {
    this.setState({ screenType })
  }

  getScreenType() {
    const {isInitialized, seedWords, noActiveNotices} = this.props;
    const {SCREEN_TYPE} = FirstTimeFlow

    return SCREEN_TYPE.UNIQUE_IMAGE

    if (!isInitialized) {
      return SCREEN_TYPE.CREATE_PASSWORD
    }

    if (!noActiveNotices) {
      return SCREEN_TYPE.TERM_OF_USE
    }

    if (seedWords) {
      return SCREEN_TYPE.BACK_UP_PHRASE
    }
  };

  renderScreen() {
    const {SCREEN_TYPE} = FirstTimeFlow

    switch (this.state.screenType) {
      case SCREEN_TYPE.CREATE_PASSWORD:
        return (
          <CreatePasswordScreen
            next={() => this.setScreenType(SCREEN_TYPE.UNIQUE_IMAGE)}
          />
        )
      case SCREEN_TYPE.UNIQUE_IMAGE:
        return (
          <UniqueImageScreen
            next={() => this.setScreenType(SCREEN_TYPE.TERM_OF_USE)}
          />
        )
      default:
        return <noscript />
    }
  }

  render() {
    return (
      <div className="first-time-flow">
        {this.renderScreen()}
      </div>
    )
  }

}

export default connect(
  ({ metamask: { isInitialized, seedWords, noActiveNotices } }) => ({
    isInitialized,
    seedWords,
    noActiveNotices
  })
)(FirstTimeFlow)

