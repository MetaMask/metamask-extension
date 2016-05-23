const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const extend = require('xtend')
const actions = require('../actions')
const valuesFor = require('../util').valuesFor
const findDOMNode = require('react-dom').findDOMNode
const AccountPanel = require('./account-panel')

module.exports = connect(mapStateToProps)(AccountsScreen)


function mapStateToProps(state) {
  return {
    accounts: state.metamask.accounts,
    identities: state.metamask.identities,
    unconfTxs: state.metamask.unconfTxs,
    selectedAddress: state.metamask.selectedAddress,
    currentDomain: state.appState.currentDomain,
    scrollToBottom: state.appState.scrollToBottom,
  }
}

inherits(AccountsScreen, Component)
function AccountsScreen() {
  Component.call(this)
}


AccountsScreen.prototype.render = function() {
  var state = this.props
  var identityList = valuesFor(state.identities)
  var unconfTxList = valuesFor(state.unconfTxs)
  var actions = {
    onSelect: this.onSelect.bind(this),
    onShowDetail: this.onShowDetail.bind(this),
    revealAccount: this.onRevealAccount.bind(this),
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
      h('section.identity-section.flex-column', {
        style: {
          height: '418px',
          overflowY: 'auto',
          overflowX: 'hidden',
        }
      },
      [
        identityList.map((identity) => {
          return h(AccountPanel, {
            key: `acct-panel-${identity.address}`,
            identity,
            selectedAddress: this.props.selectedAddress,
            accounts: this.props.accounts,
            onShowDetail: this.onShowDetail.bind(this),
          })
        }),

        h('hr.horizontal-line', {key: 'horizontal-line1'}),
        h('div.footer.hover-white.pointer', {
          key: 'reveal-account-bar',
          onClick:() => {
            actions.revealAccount()
          },
          style: {
            display: 'flex',
            flex: '1 0 auto',
            height: '40px',
            paddint: '10px',
            justifyContent: 'center',
            alignItems: 'center',
          }
        }, [
          h('i.fa.fa-chevron-down.fa-lg', {key: ''}),
        ]),
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
AccountsScreen.prototype.componentDidUpdate = function(){
  const scrollToBottom = this.props.scrollToBottom

  if (scrollToBottom) {
    var container = findDOMNode(this)
    var scrollable = container.querySelector('.identity-section')
    scrollable.scrollTop = scrollable.scrollHeight
  }
}

AccountsScreen.prototype.navigateToConfTx = function(){
  event.stopPropagation()
  this.props.dispatch(actions.showConfTxPage())
}

AccountsScreen.prototype.onSelect = function(address, event){
  event.stopPropagation()
  // if already selected, deselect
  if (this.props.selectedAddress === address) address = null
  this.props.dispatch(actions.setSelectedAddress(address))
}

AccountsScreen.prototype.onShowDetail = function(address, event){
  event.stopPropagation()
  this.props.dispatch(actions.showAccountDetail(address))
}

AccountsScreen.prototype.onRevealAccount = function() {
  this.props.dispatch(actions.revealAccount())
}

AccountsScreen.prototype.goHome = function() {
  this.props.dispatch(actions.goHome())
}
