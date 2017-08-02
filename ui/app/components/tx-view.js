const Component = require('react').Component
const connect = require('react-redux').connect
const h = require('react-hyperscript')
const inherits = require('util').inherits
const actions = require('../actions')
// slideout menu
const SlideoutMenu = require('react-burger-menu').slide
const WalletView = require('./wallet-view')

// const Identicon = require('./identicon')
// const AccountDropdowns = require('./account-dropdowns').AccountDropdowns
// const Content = require('./wallet-content-display')

module.exports = connect(mapStateToProps, mapDispatchToProps)(TxView)

function mapStateToProps (state) {
  return {
    sidebarOpen: state.appState.sidebarOpen,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    showSidebar: () => {dispatch(actions.showSidebar())},
    hideSidebar: () => {dispatch(actions.hideSidebar())},
  }
}

const contentDivider = h('div', {
  style: {
    marginLeft: '1.3em',
    marginRight: '1.3em',
    height:'1px',
    background:'#E7E7E7', // TODO: make custom color
  },
})

inherits(TxView, Component)
function TxView () {
  Component.call(this)
}

TxView.prototype.render = function () {
  return h('div.tx-view.flex-column', {
    style: {
      // width: '66.666%',
      flexGrow: 2,
      flexShrink: 0,
      flexBasis: '230px', // .666*345
      // flexBasis: '400px',
      height: '82vh',
      background: '#FFFFFF',
    }
  }, [
    // slideout - move to separate render func
    h(SlideoutMenu, {
      isOpen: this.props.sidebarOpen,
    }, [
      h(WalletView, {
        responsiveDisplayClassname: '.phone-visible'
      }),
    ]),

    h('div.phone-visible.fa.fa-bars', {
      onClick: () => {
        this.props.sidebarOpen ? this.props.hideSidebar() : this.props.showSidebar()
      }
    }, []),

    h('div.flex-row', {
      style: {
        margin: '1.8em 1.3em 0.8em 1.3em',
      }
    }, [

      // tx-view-tab.js
      h('div.flex-row', {
      }, [

        h('div', {
          style: {
            borderBottom: '0.07em solid black',
            paddingBottom: '0.015em',
          }
        }, 'TRANSACTIONS'),

        h('div', {
          style: {
            marginLeft: '1.25em',
          }
        }, 'TOKENS'),

      ]),
    ]),

    contentDivider,

    this.renderTransactionListItem(),

    contentDivider,

    this.renderTransactionListItem(),

    contentDivider,

  ])
  // column
  // tab row
  // divider
  // item
}

TxView.prototype.renderTransactionListItem = function () {
  return h('div.flex-column', {
    style: {
      alignItems: 'stretch',
      margin: '0.6em 1.3em 0.6em 1.3em',
    }
  }, [

    h('div', {
      style: {
        flexGrow: 1,
        marginTop: '0.3em',
      }
    }, 'Jul 01, 2017'),

    h('div.flex-row', {
      style: {
        alignItems: 'stretch',
      }
    }, [

      h('div', {
        style: {
          flexGrow: 1,
        }
      }, 'icon'),

      h('div', {
        style: {
          flexGrow: 3,
        }
      }, 'Hash'),

      h('div', {
        style: {
          flexGrow: 5,
        }
      }, 'Status'),

      h('div', {
        style: {
          flexGrow: 2,
        }
      }, 'Details'),

    ])

  ])
}


