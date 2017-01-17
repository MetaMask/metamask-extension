const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const connect = require('react-redux').connect

module.exports = connect(mapStateToProps)(ImportIndex)

function mapStateToProps (state) {
  return {}
}

inherits(ImportIndex, Component)
function ImportIndex () {
  Component.call(this)
}

ImportIndex.prototype.render = function () {
  const props = this.props


  return (

    h('.accounts-section.flex-grow', [

      // subtitle and nav
      h('.section-title.flex-center', [
        h('i.fa.fa-arrow-left.fa-lg.cursor-pointer', {
          onClick: this.goHome.bind(this),
        }),
        h('h2.page-subtitle', 'Select Account'),
      ]),

    ])
  )
}

