const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits

const Tooltip = require('./tooltip')
const copyToClipboard = require('copy-to-clipboard')

module.exports = Copyable

inherits(Copyable, Component)
function Copyable () {
  Component.call(this)
  this.state = {
    copied: false,
  }
}

Copyable.prototype.render = function () {
  const props = this.props
  const state = this.state
  const { value, children } = props
  const { copied } = state

  return h(Tooltip, {
    title: copied ? 'Copied!' : 'Copy',
    position: 'bottom',
  }, h('span', {
    style: {
      cursor: 'pointer',
    },
    onClick: (event) => {
      event.preventDefault()
      event.stopPropagation()
      copyToClipboard(value)
      this.debounceRestore()
    },
  }, children))
}

Copyable.prototype.debounceRestore = function () {
  this.setState({ copied: true })
  clearTimeout(this.timeout)
  this.timeout = setTimeout(() => {
    this.setState({ copied: false })
  }, 850)
}
