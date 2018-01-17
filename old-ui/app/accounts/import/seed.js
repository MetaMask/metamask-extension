const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const connect = require('react-redux').connect

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
      `Paste your seed phrase here!`,
      h('textarea'),
      h('br'),
      h('button', 'Submit'),
    ])
  )
}

