const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const extend = require('xtend')
const Identicon = require('./components/identicon')
const actions = require('./actions')
const EtherBalance = require('./components/eth-balance')
const valuesFor = require('./util').valuesFor
const addressSummary = require('./util').addressSummary
const formatBalance = require('./util').formatBalance
const findDOMNode = require('react-dom').findDOMNode

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
        identityList.map(renderAccountPanel),

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

  function renderAccountPanel(identity){
    var mayBeFauceting = identity.mayBeFauceting
    var isSelected = state.selectedAddress === identity.address
    var account = state.accounts[identity.address]
    var isFauceting = mayBeFauceting && account.balance === '0x0'
    var componentState = extend(actions, {
      identity: identity,
      account: account,
      isSelected: false,
      isFauceting: isFauceting,
    })
    const selectedClass = isSelected ? '.selected' : ''

    return (
      h(`.accounts-list-option.flex-row.flex-space-between.pointer.hover-white${selectedClass}`, {
        key: `account-panel-${identity.address}`,
        style: {
          flex: '1 0 auto',
        },
        onClick: (event) => actions.onShowDetail(identity.address, event),
      }, [

        h('.identicon-wrapper.flex-column.flex-center.select-none', [
          h(Identicon, {
            address: identity.address
          }),
        ]),

        // account address, balance
        h('.identity-data.flex-column.flex-justify-center.flex-grow.select-none', [

          h('span', identity.name),
          h('span.font-small', addressSummary(identity.address)),
          // h('span.font-small', formatBalance(account.balance)),
          h(EtherBalance, {
            value: account.balance,
          }),

        ]),

      ])
    )
  }
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
