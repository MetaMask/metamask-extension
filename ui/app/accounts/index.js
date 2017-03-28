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
  const pendingTxs = valuesFor(state.metamask.unapprovedTxs)
  .filter(txMeta => txMeta.metamaskNetworkId === state.metamask.network)
  const pendingMsgs = valuesFor(state.metamask.unapprovedMsgs)
  const pending = pendingTxs.concat(pendingMsgs)

  return {
    accounts: state.metamask.accounts,
    identities: state.metamask.identities,
    unapprovedTxs: state.metamask.unapprovedTxs,
    selectedAddress: state.metamask.selectedAddress,
    scrollToBottom: state.appState.scrollToBottom,
    pending,
    keyrings: state.metamask.keyrings,
  }
}

inherits(AccountsScreen, Component)
function AccountsScreen () {
  Component.call(this)
}

AccountsScreen.prototype.render = function () {
  const props = this.props
  const { keyrings } = props
  const identityList = valuesFor(props.identities)
  const unapprovedTxList = valuesFor(props.unapprovedTxs)

  return (

    h('.accounts-section.flex-grow', [

      // subtitle and nav
      h('.section-title.flex-center', [
        h('i.fa.fa-arrow-left.fa-lg.cursor-pointer', {
          onClick: this.goHome.bind(this),
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

            const simpleAddress = identity.address.substring(2).toLowerCase()
            const keyring = keyrings.find((kr) => {
              return kr.accounts.includes(simpleAddress) ||
                kr.accounts.includes(identity.address)
            })

            return h(AccountListItem, {
              key: `acct-panel-${identity.address}`,
              identity,
              selectedAddress: this.props.selectedAddress,
              accounts: this.props.accounts,
              onShowDetail: this.onShowDetail.bind(this),
              pending,
              keyring,
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

      unapprovedTxList.length ? (

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

AccountsScreen.prototype.onShowDetail = function (address, event) {
  event.stopPropagation()
  this.props.dispatch(actions.showAccountDetail(address))
}

AccountsScreen.prototype.addNewAccount = function () {
  this.props.dispatch(actions.addNewAccount(0))
}

/* An optional view proposed in this design:
 * https://consensys.quip.com/zZVrAysM5znY
AccountsScreen.prototype.addNewAccount = function () {
  this.props.dispatch(actions.navigateToNewAccountScreen())
}
*/

AccountsScreen.prototype.goHome = function () {
  this.props.dispatch(actions.goHome())
}
