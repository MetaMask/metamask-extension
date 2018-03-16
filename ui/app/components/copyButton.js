const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const copyToClipboard = require('copy-to-clipboard')
const t = require('../../i18n-helper').getMessage

const Tooltip = require('./tooltip')

module.exports = CopyButton

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

  const message = copied ? t(this.props.localeMessages, 'copiedButton') : props.title || t(this.props.localeMessages, 'copyButton')

  return h('.copy-button', {
    style: {
      display: 'flex',
      alignItems: 'center',
    },
  }, [

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

  ])
}

CopyButton.prototype.debounceRestore = function () {
  this.setState({ copied: true })
  clearTimeout(this.timeout)
  this.timeout = setTimeout(() => {
    this.setState({ copied: false })
  }, 850)
}
