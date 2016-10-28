const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const actions = require('../actions')
const valuesFor = require('../util').valuesFor
const findDOMNode = require('react-dom').findDOMNode
const AccountListItem = require('./account-list-item')

module.exports = connect(mapStateToProps)(AccountsScreen)

function mapStateToProps (state) {
  const pendingTxs = valuesFor(state.metamask.unconfTxs)
  .filter(tx => tx.txParams.metamaskNetworkId === state.metamask.network)
  const pendingMsgs = valuesFor(state.metamask.unconfMsgs)
  const pending = pendingTxs.concat(pendingMsgs)

  return {
    accounts: state.metamask.accounts,
    identities: state.metamask.identities,
    unconfTxs: state.metamask.unconfTxs,
    selectedAddress: state.metamask.selectedAddress,
    scrollToBottom: state.appState.scrollToBottom,
    pending,
  }
}

inherits(AccountsScreen, Component)
function AccountsScreen () {
  Component.call(this)
}

AccountsScreen.prototype.render = function () {
  var state = this.props
  var identityList = valuesFor(state.identities)
  var unconfTxList = valuesFor(state.unconfTxs)
  var actions = {
    onSelect: this.onSelect.bind(this),
    onShowDetail: this.onShowDetail.bind(this),
    goHome: this.goHome.bind(this),
  }
  return (

    h('.accounts-section.flex-grow', [

      // subtitle and nav
      h('.section-title.flex-center', [
        h('i.fa.fa-arrow-left.fa-lg.cursor-pointer', {
          onClick: actions.goHome,
        }),
        h('h2.page-subtitle', 'Select Account'),
      ]),

      h('hr.horizontal-line'),

      // identity selection
      h('section.identity-section', {
        style: {
          height: '418px',
          overflowY: 'auto',
          overflowX: 'hidden',
        },
      },
        [
          identityList.map((identity) => {
            const pending = this.props.pending.filter((txOrMsg) => {
              if ('txParams' in txOrMsg) {
                return txOrMsg.txParams.from === identity.address
              } else if ('msgParams' in txOrMsg) {
                return txOrMsg.msgParams.from === identity.address
              } else {
                return false
              }
            })

            return h(AccountListItem, {
              key: `acct-panel-${identity.address}`,
              identity,
              selectedAddress: this.props.selectedAddress,
              accounts: this.props.accounts,
              onShowDetail: this.onShowDetail.bind(this),
              pending,
            })
          }),

          h('hr.horizontal-line'),
          h('div.footer.hover-white.pointer', {
            key: 'reveal-account-bar',
            onClick: () => {
              this.addNewAccount()
            },
            style: {
              display: 'flex',
              height: '40px',
              paddint: '10px',
              justifyContent: 'center',
              alignItems: 'center',
            },
          }, [
            h('i.fa.fa-plus.fa-lg', {key: ''}),
          ]),
          h('hr.horizontal-line'),
        ]),

      unconfTxList.length ? (

        h('.unconftx-link.flex-row.flex-center', {
          onClick: this.navigateToConfTx.bind(this),
        }, [
          h('span', 'Unconfirmed Txs'),
          h('i.fa.fa-arrow-right.fa-lg'),
        ])

      ) : (
        null
      ),
    ])
  )
}

// If a new account was revealed, scroll to the bottom
AccountsScreen.prototype.componentDidUpdate = function () {
  const scrollToBottom = this.props.scrollToBottom

  if (scrollToBottom) {
    var container = findDOMNode(this)
    var scrollable = container.querySelector('.identity-section')
    scrollable.scrollTop = scrollable.scrollHeight
  }
}

AccountsScreen.prototype.navigateToConfTx = function () {
  event.stopPropagation()
  this.props.dispatch(actions.showConfTxPage())
}

AccountsScreen.prototype.onSelect = function (address, event) {
  event.stopPropagation()
  // if already selected, deselect
  if (this.props.selectedAddress === address) address = null
  this.props.dispatch(actions.setSelectedAddress(address))
}

AccountsScreen.prototype.onShowDetail = function (address, event) {
  event.stopPropagation()
  this.props.dispatch(actions.showAccountDetail(address))
}

AccountsScreen.prototype.addNewAccount = function () {
  this.props.dispatch(actions.addNewAccount(0))
}

AccountsScreen.prototype.goHome = function () {
  this.props.dispatch(actions.goHome())
}
