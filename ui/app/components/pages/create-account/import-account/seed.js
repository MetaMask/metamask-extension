const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const connect = require('../../../../metamask-connect')

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
      this.props.t('pasteSeed'),
      h('textarea'),
      h('br'),
      h('button', this.props.t('submit')),
    ])
  )
}
