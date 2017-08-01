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
    }, [
      // tab
      h('div.flex-column', {

      }, [
        h('div', {}, 'Transactions'),
        h('div', {
          style: {
            height: '0.5em',
            color: 'black',
            width: '100%',
          }
        })
      ]),

      // tab2
    ])
  ])
  // column
  // tab row
  // divider
  // item
}
