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

  return h('img.cursor-pointer.color-orange', {
    src: 'images/copy.svg',
    title: 'Copy Address',
    onClick: (event) => {
      event.preventDefault()
      event.stopPropagation()
      copyToClipboard(value)
    },
  })
}
