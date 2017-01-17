const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const connect = require('react-redux').connect

module.exports = connect(mapStateToProps)(JsonImportSubview)

function mapStateToProps (state) {
  return {}
}

inherits(JsonImportSubview, Component)
function JsonImportSubview () {
  Component.call(this)
}

JsonImportSubview.prototype.render = function () {
  return (
    h('div', {
      style: {
      },
    }, [
      `Upload your json file here!`,
    ])
  )
}

