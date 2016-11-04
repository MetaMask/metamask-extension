const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const actions = require('../../actions')

// Components
const TabBar = require('../components/tab-bar')

// Subviews
const NewAccountView = require('./new')
const ImportAccountView = require('./import')

module.exports = connect(mapStateToProps)(AddAccountScreen)

function mapStateToProps (state) {
  return {}
}

inherits(AddAccountScreen, Component)
function AddAccountScreen () {
  Component.call(this)
}

AddAccountScreen.prototype.render = function () {
  const props = this.props
  const state = this.state || {}
  const subview = state.subview || 'new'

  return (
    h('.flex-column', {
      style: {
      },
    }, [

      // title and nav
      h('.flex-row.space-between', {
        style: {
          alignItems: 'center',
          padding: '0px 20px',
        }
      }, [
        h('i.fa.fa-arrow-left.fa-lg.cursor-pointer', {
          onClick: this.goHome.bind(this),
        }),
        h('h2.page-subtitle', 'Add Account'),
        h('i', { style: { width: '18px' } }),
      ]),

      h(TabBar, {
        tabs: [
          { content: 'Create New', key: 'new' },
          { content: 'Import', key: 'import' },
        ],
        defaultTab: 'new',
        tabSelected: (key) => {
          this.setState({ subview: key })
        }
      }),

      this.renderNewOrImport(),

    ])
  )
}

AddAccountScreen.prototype.goHome = function() {
  this.props.dispatch(actions.showAccountPage())
}

AddAccountScreen.prototype.renderNewOrImport = function() {
  const state = this.state || {}
  const subview = state.subview || 'new'

  switch (subview) {
    case 'new':
      return h(NewAccountView)

    case 'import':
      return h(ImportAccountView)
  }
}
