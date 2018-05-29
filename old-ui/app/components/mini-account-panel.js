const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const Identicon = require('./identicon')

module.exports = AccountPanel


inherits(AccountPanel, Component)
function AccountPanel () {
  Component.call(this)
}

AccountPanel.prototype.render = function () {
  var props = this.props
  var picOrder = props.picOrder || 'left'
  const { imageSeed } = props

  return (

    h('.identity-panel.flex-row.flex-left', {
      style: {
        cursor: props.onClick ? 'pointer' : undefined,
      },
      onClick: props.onClick,
    }, [

      this.genIcon(imageSeed, picOrder),

      h('div.flex-column.flex-justify-center', {
        style: {
          lineHeight: '15px',
          order: 2,
          display: 'flex',
          alignItems: picOrder === 'left' ? 'flex-begin' : 'flex-end',
        },
      }, this.props.children),
    ])
  )
}

AccountPanel.prototype.genIcon = function (seed, picOrder) {
  const props = this.props

  // When there is no seed value, this is a contract creation.
  // We then show the contract icon.
  if (!seed) {
    return h('.identicon-wrapper.flex-column.select-none', {
      style: {
        order: picOrder === 'left' ? 1 : 3,
      },
    }, [
      h('i.fa.fa-file-text-o.fa-lg', {
        style: {
          fontSize: '42px',
          transform: 'translate(0px, -16px)',
        },
      }),
    ])
  }

  // If there was a seed, we return an identicon for that address.
  return h('.identicon-wrapper.flex-column.select-none', {
    style: {
      order: picOrder === 'left' ? 1 : 3,
    },
  }, [
    h(Identicon, {
      address: seed,
      imageify: props.imageifyIdenticons,
    }),
  ])
}

