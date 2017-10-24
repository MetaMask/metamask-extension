const inherits = require('util').inherits
const Component = require('react').Component
const connect = require('react-redux').connect
const h = require('react-hyperscript')
const actions = require('../../actions')
const { Menu, Item, Divider, CloseArea } = require('../dropdowns/components/menu')
const Identicon = require('../identicon')
const { formatBalance } = require('../../util')

module.exports = connect(mapStateToProps, mapDispatchToProps)(AccountMenu)

inherits(AccountMenu, Component)
function AccountMenu () { Component.call(this) }

function mapStateToProps (state) {
  return {
    selectedAddress: state.metamask.selectedAddress,
    isAccountMenuOpen: state.metamask.isAccountMenuOpen,
    keyrings: state.metamask.keyrings,
    identities: state.metamask.identities,
    accounts: state.metamask.accounts,

  }
}

function mapDispatchToProps (dispatch) {
  return {
    toggleAccountMenu: () => dispatch(actions.toggleAccountMenu()),
    showAccountDetail: address => {
      dispatch(actions.showAccountDetail(address))
      dispatch(actions.toggleAccountMenu())
    },
    lockMetamask: () => {
      dispatch(actions.lockMetamask())
      dispatch(actions.toggleAccountMenu())
    },
    showConfigPage: () => {
      dispatch(actions.showConfigPage())
      dispatch(actions.toggleAccountMenu())
    },
    showNewAccountModal: () => {
      dispatch(actions.showModal({ name: 'NEW_ACCOUNT' }))
      dispatch(actions.toggleAccountMenu())
    },
    showImportPage: () => {
      dispatch(actions.showImportPage())
      dispatch(actions.toggleAccountMenu())
    },
  }
}

AccountMenu.prototype.render = function () {
  const {
    isAccountMenuOpen,
    toggleAccountMenu,
    showNewAccountModal,
    showImportPage,
    lockMetamask,
    showConfigPage,
  } = this.props

  return h(Menu, { className: 'account-menu', isShowing: isAccountMenuOpen }, [
    h(CloseArea, { onClick: toggleAccountMenu }),
    h(Item, {
      className: 'account-menu__header',
      onClick: lockMetamask,
    }, [
      'My Accounts',
      h('button.account-menu__logout-button', 'Log out'),
    ]),
    h(Divider),
    h('div.account-menu__accounts', this.renderAccounts()),
    h(Divider),
    h(Item, {
      onClick: showNewAccountModal,
      icon: h('img', { src: 'images/plus-btn-white.svg' }),
      text: 'Create Account',
    }),
    h(Item, {
      onClick: showImportPage,
      icon: h('img', { src: 'images/import-account.svg' }),
      text: 'Import Account',
    }),
    h(Divider),
    h(Item, {
      icon: h('img', { src: 'images/mm-info-icon.svg' }),
      text: 'Info & Help',
    }),
    h(Item, {
      onClick: showConfigPage,
      icon: h('img', { src: 'images/settings.svg' }),
      text: 'Settings',
    }),
  ])
}

AccountMenu.prototype.renderAccounts = function () {
  const {
    identities,
    accounts,
    selected,
    keyrings,
    showAccountDetail,
  } = this.props

  return Object.keys(identities).map((key, index) => {
    const identity = identities[key]
    const isSelected = identity.address === selected

    const balanceValue = accounts[key] ? accounts[key].balance : ''
    const formattedBalance = balanceValue ? formatBalance(balanceValue, 6) : '...'
    const simpleAddress = identity.address.substring(2).toLowerCase()

    const keyring = keyrings.find((kr) => {
      return kr.accounts.includes(simpleAddress) ||
        kr.accounts.includes(identity.address)
    })

    return h(
      'div.account-menu__account.menu__item--clickable',
      { onClick: () => showAccountDetail(identity.address) },
      [
        h('div.account-menu__check-mark', [
          isSelected ? h('i.fa.fa-check') : null,
        ]),

        h(
          Identicon,
          {
            address: identity.address,
            diameter: 24,
          },
        ),

        h('div.account-menu__account-info', [
          h('div.account-menu__name', identity.name || ''),
          h('div.account-menu__balance', formattedBalance),
        ]),

        this.indicateIfLoose(keyring),
      ],
    )
  })
}

AccountMenu.prototype.indicateIfLoose = function (keyring) {
  try { // Sometimes keyrings aren't loaded yet:
    const type = keyring.type
    const isLoose = type !== 'HD Key Tree'
    return isLoose ? h('.keyring-label', 'IMPORTED') : null
  } catch (e) { return }
}
