<<<<<<< HEAD
const Component = require('react').Component
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const inherits = require('util').inherits
const copyToClipboard = require('copy-to-clipboard')
const connect = require('react-redux').connect

const Tooltip = require('./tooltip')
=======
import React, { Component } from 'react'
import PropTypes from 'prop-types'

import copyToClipboard from 'copy-to-clipboard'
import Tooltip from './tooltip'
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc

CopyButton.contextTypes = {
  t: PropTypes.func,
}

module.exports = connect()(CopyButton)


inherits(CopyButton, Component)
function CopyButton () {
  Component.call(this)
}

// As parameters, accepts:
// "value", which is the value to copy (mandatory)
// "title", which is the text to show on hover (optional, defaults to 'Copy')
CopyButton.prototype.render = function () {
  const props = this.props
  const state = this.state || {}

  const value = props.value
  const copied = state.copied

  const message = copied ? this.context.t('copiedButton') : props.title || this.context.t('copyButton')

  return h('.copy-button', {
    style: {
      display: 'flex',
      alignItems: 'center',
    },
  }, [

<<<<<<< HEAD
    h(Tooltip, {
      title: message,
    }, [
      h('i.fa.fa-clipboard.cursor-pointer.color-orange', {
        style: {
          margin: '5px',
        },
        onClick: (event) => {
          event.preventDefault()
          event.stopPropagation()
          copyToClipboard(value)
          this.debounceRestore()
        },
      }),
    ]),
=======
  render () {
    const { title, value } = this.props
    const { copied } = this.state
    const message = copied ? this.context.t('copiedButton') : title || this.context.t('copyButton')
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc

  ])
}

<<<<<<< HEAD
CopyButton.prototype.debounceRestore = function () {
  this.setState({ copied: true })
  clearTimeout(this.timeout)
  this.timeout = setTimeout(() => {
    this.setState({ copied: false })
  }, 850)
}
=======
export default CopyButton
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
