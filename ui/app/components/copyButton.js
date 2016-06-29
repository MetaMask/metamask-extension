const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const copyToClipboard = require('copy-to-clipboard')

module.exports = CopyButton

inherits(CopyButton, Component)
function CopyButton () {
  Component.call(this)
}

CopyButton.prototype.render = function () {
  const props = this.props
  const value = props.value

  return h('i.fa.fa-clipboard.cursor-pointer.color-orange', {
    title: props.title || 'Copy',
    style: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      margin: '5px',
    },
    onClick: (event) => {
      event.preventDefault()
      event.stopPropagation()
      copyToClipboard(value)
    },
  })
}
