const Component = require('react').Component
const connect = require('react-redux').connect
const h = require('react-hyperscript')
const inherits = require('util').inherits
// const Identicon = require('./identicon')
// const AccountDropdowns = require('./account-dropdowns').AccountDropdowns
// const Content = require('./wallet-content-display')

module.exports = connect()(TxView)

// function mapStateToProps (state) {
//   return {
//     network: state.metamask.network,
//   }
// }
// 
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
      width: '66.666%',
      height: '82vh',
      background: '#FFFFFF',
    }
  }, [
    h('div.flex-row', {
      style: {
        margin: '1.8em 1.3em',
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
            marginLeft: '2em',
          }
        }, 'TOKENS'),

      ]),
    ])

    h('')
  ])
  // column
  // tab row
  // divider
  // item
}
