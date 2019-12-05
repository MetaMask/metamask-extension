import classnames from 'classnames'
import PropTypes from 'prop-types'
import React, { Component } from 'react'

class Alert extends Component {
  state = {
    visible: false,
    msg: false,
    className: '',
  }

  componentWillReceiveProps (nextProps) {
    if (!this.props.visible && nextProps.visible) {
      this.animateIn(nextProps)
    } else if (this.props.visible && !nextProps.visible) {
      this.animateOut()
    }
  }

  animateIn (props) {
    this.setState({
      msg: props.msg,
      visible: true,
      className: 'visible',
    })
  }

  animateOut () {
    this.setState({
      msg: null,
      className: 'hidden',
    })

    setTimeout(_ => {
      this.setState({visible: false})
    }, 500)

  }

  render () {
    if (this.state.visible) {
      return (
        <div className={classnames('global-alert', this.state.className)}>
          <a className="msg">{this.state.msg}</a>
        </div>
      )
    }
    return null
  }
}

Alert.propTypes = {
  visible: PropTypes.bool.isRequired,
  msg: PropTypes.string,
}
module.exports = Alert

