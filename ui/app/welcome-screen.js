import EventEmitter from 'events'
import h from 'react-hyperscript'
import { Component } from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import {closeWelcomeScreen} from './actions'
import Mascot from './components/mascot'
const t = require('../i18n')

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

          h(Mascot, {
            animationEventEmitter: this.animationEventEmitter,
            width: '225',
            height: '225',
          }),

          h('div.welcome-screen__info__header', t('welcomeMeta')),

          h('div.welcome-screen__info__copy', t('metaIs')),

          h('div.welcome-screen__info__copy', t(`holdEther`)),

          h('button.welcome-screen__button', {
            onClick: this.initiateAccountCreation,
          }, t('continue')),

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
