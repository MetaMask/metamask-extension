const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const extend = require('xtend')
const actions = require('./actions')
const AccountPanel = require('./components/account-panel')
const valuesFor = require('./util').valuesFor

module.exports = connect(mapStateToProps)(AccountsScreen)


function mapStateToProps(state) {
  return {
    accounts: state.metamask.accounts,
    identities: state.metamask.identities,
    unconfTxs: state.metamask.unconfTxs,
    selectedAddress: state.metamask.selectedAddress,
    currentDomain: state.appState.currentDomain,
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
  }
  return (

    h('.accounts-section.flex-column.flex-grow', [

      // subtitle and nav
      h('.section-title.flex-column.flex-center', [
        h('h2.page-subtitle', 'Accounts'),
      ]),

      // current domain
      /* AUDIT
       * Temporarily removed
       * since accounts are currently injected
       * regardless of the current domain.
       */
      h('.current-domain-panel.flex-center.font-small', [
        h('spam', 'Selected address is visible to all sites you visit.'),
        // h('span', state.currentDomain),
      ]),

      // identity selection
      h('section.identity-section.flex-column', {
        style: {
          maxHeight: '290px',
          overflowY: 'auto',
          overflowX: 'hidden',
        }
      },
        identityList.map(renderAccountPanel)
      ),

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

  function renderAccountPanel(identity){
    var mayBeFauceting = identity.mayBeFauceting
    var isSelected = state.selectedAddress === identity.address
    var account = state.accounts[identity.address]
    var isFauceting = mayBeFauceting && account.balance === '0x0'
    var componentState = extend(actions, {
      identity: identity,
      account: account,
      isSelected: isSelected,
      isFauceting: isFauceting,
    })
    return h(AccountPanel, componentState)
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
