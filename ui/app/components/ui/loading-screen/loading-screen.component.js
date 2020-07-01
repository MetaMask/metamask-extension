import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Spinner from '../spinner'

class LoadingScreen extends Component {
  static defaultProps = {
    loadingMessage: null,
  }

  static propTypes = {
    loadingMessage: PropTypes.string,
  }

  renderMessage () {
    const { loadingMessage } = this.props
    return loadingMessage
      ? <span>{loadingMessage}</span>
      : null
  }

  render () {
    return (
      <div className="loading-overlay">
        <div className="loading-overlay__container">
          <Spinner color="#F7C06C" />
          {this.renderMessage()}
        </div>
      </div>
    )
  }
}

export default LoadingScreen
