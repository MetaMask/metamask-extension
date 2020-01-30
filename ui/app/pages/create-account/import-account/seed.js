const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const PropTypes = require('prop-types')
const connect = require('react-redux').connect

SeedImportSubview.contextTypes = {
  t: PropTypes.func,
}

module.exports = connect(mapStateToProps)(SeedImportSubview)


function mapStateToProps () {
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
      this.context.t('pasteSeed'),
      h('textarea'),
      h('br'),
      h('button', this.context.t('submit')),
    ])
  )
}
