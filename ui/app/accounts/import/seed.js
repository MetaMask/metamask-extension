const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const connect = require('../../metamask-connect')
const t = require('../../../i18n-helper').getMessage

module.exports = connect(mapStateToProps)(SeedImportSubview)

function mapStateToProps (state) {
  return {}
}

inherits(SeedImportSubview, Component)
function SeedImportSubview () {
  Component.call(this)
}

SeedImportSubview.prototype.render = function () {
  return (
    h('div', {
      style: {
      },
    }, [
      t(this.props.localeMessages, 'pasteSeed'),
      h('textarea'),
      h('br'),
      h('button', t(this.props.localeMessages, 'submit')),
    ])
  )
}
