import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

const copyToClipboard = require('copy-to-clipboard')
const Tooltip = require('./tooltip')

class CopyButton extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static defaultProps = {
    title: null,
  }

  static propTypes = {
    value: PropTypes.string.isRequired,
    title: PropTypes.string,
  }

  state = {}

  debounceRestore = () => {
    this.setState({ copied: true })
    clearTimeout(this.timeout)
    this.timeout = setTimeout(() => {
      this.setState({ copied: false })
    }, 850)
  }

  render () {
    const state = this.state
    const props = this.props
    const value = props.value
    const copied = state.copied
    const message = copied ? this.context.t('copiedButton') : props.title || this.context.t('copyButton')

    return (
      <div
        className="copy-button"
        style={{
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Tooltip title={message}>
          <i
            className="fa fa-clipboard cursor-pointer color-orange"
            style={{
              margin: '5px',
            }}
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              copyToClipboard(value)
              this.debounceRestore()
            }}
          />
        </Tooltip>
      </div>
    )
  }
}

module.exports = connect()(CopyButton)
