const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const TabBar = require('../components/tab-bar')

module.exports = connect(mapStateToProps)(NewAccountScreen)

function mapStateToProps (state) {
  return {}
}

inherits(NewAccountScreen, Component)
function NewAccountScreen () {
  Component.call(this)
}

NewAccountScreen.prototype.render = function () {
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
          console.log('selected ' + key)
        }
      }),

    ])
  )
}

NewAccountScreen.prototype.goHome = function() {
  this.props.dispatch(actions.showAccountPage())
}
