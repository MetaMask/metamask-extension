<<<<<<< HEAD
const { Component } = require('react')
const h = require('react-hyperscript')
const PropTypes = require('prop-types')
const Spinner = require('../spinner')
=======
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Spinner from '../spinner'
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc

class LoadingScreen extends Component {
  renderMessage () {
    const { loadingMessage } = this.props
    return loadingMessage && h('span', loadingMessage)
  }

  render () {
    return (
      h('.loading-overlay', [
        h('.loading-overlay__container', [
          h(Spinner, {
            color: '#F7C06C',
          }),

          this.renderMessage(),
        ]),
      ])
    )
  }
}

<<<<<<< HEAD
LoadingScreen.propTypes = {
  loadingMessage: PropTypes.string,
}

module.exports = LoadingScreen
=======
export default LoadingScreen
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
