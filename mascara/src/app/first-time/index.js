import React, {Component, PropTypes} from 'react'
import CreatePasswordScreen from './create-password-screen'

export default class FirstTimeFlow extends Component {

  static propTypes = {
    screenType: PropTypes.string
  };

  static defaultProps = {
    screenType: FirstTimeFlow.CREATE_PASSWORD
  };

  static SCREEN_TYPE = {
    CREATE_PASSWORD: 'create_password',
    UNIQUE_IMAGE: 'unique_image',
    TERM_OF_USE: 'term_of_use',
    BACK_UP_PHRASE: 'back_up_phrase',
    CONFIRM_BACK_UP_PHRASE: 'confirm_back_up_phrase',
    BUY_ETHER: 'buy_ether'
  };

  static getScreenType = ({isInitialized, noActiveNotices, seedWords}) => {
    const {SCREEN_TYPE} = FirstTimeFlow

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

    switch (this.props.screenType) {
      case SCREEN_TYPE.CREATE_PASSWORD:
        return <CreatePasswordScreen />
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
