import EventEmitter from 'events'
import h from 'react-hyperscript'
import { Component } from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import {closeWelcomeScreen} from './actions'
import Mascot from './components/mascot'

class WelcomeScreen extends Component {
  static propTypes = {
    closeWelcomeScreen: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props)
    this.animationEventEmitter = new EventEmitter()
  }

  initiateAccountCreation = () => {
    this.props.closeWelcomeScreen()
  }

  render () {
    return h('div.welcome-screen', [

        h('div.welcome-screen__info', [

          // h(Mascot, {
          //   animationEventEmitter: this.animationEventEmitter,
          //   width: '225',
          //   height: '225',
          // }),

          h('img', {
            style: {
              width: '225',
              height: '225',
            },
            src: 'images/icon-512.png',
          }),

          h('div.welcome-screen__info__header', 'Welcome to Akroma'),

          h('p.welcome-screen__info__copy', 'Akroma is a wallet and identity vault.'),

          h('p.welcome-screen__info__copy', `It allows you to hold AKA & tokens, and serves as your bridge to decentralized applications.`),

          h('button.welcome-screen__button', {
            onClick: this.initiateAccountCreation,
          }, 'Continue'),

        ]),

    ])
  }
}

export default connect(
  null,
  dispatch => ({
    closeWelcomeScreen: () => dispatch(closeWelcomeScreen()),
  })
)(WelcomeScreen)
