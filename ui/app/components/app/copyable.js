import React, { Component } from 'react'
const PropTypes = require('prop-types')
const Tooltip = require('../ui/tooltip')
const copyToClipboard = require('copy-to-clipboard')

class Copyable extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  state = {
    copied: false,
  }

  debounceRestore = () => {
    this.setState({ copied: true })
    clearTimeout(this.timeout)
    this.timeout = setTimeout(() => {
      this.setState({ copied: false })
    }, 850)
  }

  render () {
    const props = this.props
    const state = this.state
    const { value, children } = props
    const { copied } = state

    return (
      <Tooltip
        title={
          copied
            ? this.context.t('copiedExclamation')
            : this.context.t('copy')
        }
        position="bottom"
      >
        <span
          style={{
            cursor: 'pointer',
          }}
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            copyToClipboard(value)
            this.debounceRestore()
          }}>
          {children}
        </span>
      </Tooltip>
    )
  }
}

module.exports = Copyable
