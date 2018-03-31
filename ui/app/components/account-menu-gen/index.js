/**
 * @file      Account Menu Component, partially with a generic UI.
 * @copyright Copyright (c) 2018 MetaMask
 * @license   MIT
 */

const inherits = require('util').inherits
const Component = require('react').Component
const connect = require('react-redux').connect
const h = require('react-hyperscript')

const actions = require('../../actions')
const { Menu, Item, Divider, CloseArea } = require('../dropdowns/components/menu')
const Identicon = require('../identicon')
const { formatBalance } = require('../../util')
const t = require('../../../i18n')

module.exports = connect(mapStateToProps, mapDispatchToProps)(AccountMenu)

// ?
inherits(AccountMenu, Component)

// Constructor
function AccountMenu () {
  Component.call(this) 
}

/**
 * Maps state objects to properties, to simplify access
 */
function mapStateToProps (state) {
  return {
    selectedAddress:    state.metamask.selectedAddress,
    isAccountMenuOpen:  state.metamask.isAccountMenuOpen,
    keyrings:           state.metamask.keyrings,
    identities:         state.metamask.identities,
    accounts:           state.metamask.accounts,
    walletProviders:   state.metamask.walletProviders,
  }
}

/**
 * TODO
 * 
 * @param {*} dispatch 
 */
function mapDispatchToProps (dispatch) {
  return {
    toggleAccountMenu: () => dispatch(actions.toggleAccountMenu()),
    showAccountDetail: address => {
      dispatch(actions.showAccountDetail(address))
      dispatch(actions.hideSidebar())
      dispatch(actions.toggleAccountMenu())
    },
    lockMetamask: () => {
      dispatch(actions.lockMetamask())
      dispatch(actions.hideWarning())
      dispatch(actions.hideSidebar())
      dispatch(actions.toggleAccountMenu())
    },
    showConfigPage: () => {
      dispatch(actions.showConfigPage())
      dispatch(actions.hideSidebar())
      dispatch(actions.toggleAccountMenu())
    },
    showNewAccountPage: (formToSelect) => {
      dispatch(actions.showNewAccountPage(formToSelect))
      dispatch(actions.hideSidebar())
      dispatch(actions.toggleAccountMenu())
    },
    showInfoPage: () => {
      dispatch(actions.showInfoPage())
      dispatch(actions.hideSidebar())
      dispatch(actions.toggleAccountMenu())
    },
  }
}

/**
 * Renders the Account Menu
 */
AccountMenu.prototype.render = function () {
  const {
    isAccountMenuOpen,
    toggleAccountMenu,
    showNewAccountPage,
    lockMetamask,
    showConfigPage,
    showInfoPage,
  } = this.props

  return h(Menu, { className: 'account-menu', isShowing: isAccountMenuOpen }, [
    h(CloseArea, { onClick: toggleAccountMenu }),
    h(Item, {
      className: 'account-menu__header',
    }, [
      t('myAccounts'),
      h('button.account-menu__logout-button', {
        onClick: lockMetamask,
      }, t('logout')),
    ]),
    h(Divider),
    h('div.account-menu__accounts', this.renderAccounts()),
    h(Divider),

    this.renderAccountNew(),

    h(Divider),
    h(Item, {
      onClick: showInfoPage,
      icon: h('img', { src: 'images/mm-info-icon.svg' }),
      text: t('infoHelp'),
    }),
    h(Item, {
      onClick: showConfigPage,
      icon: h('img.account-menu__item-icon', { src: 'images/settings.svg' }),
      text: t('settings'),
    }),
  ])
}


/**
 * Renders the Account-New Menu-Entries dynamically, using walletProviders data
 * 
 * Relevant data is passed within the kyeringProviders state object
 * 
 */
AccountMenu.prototype.renderAccountNew = function () {

  // UI type will be later supplemented with e.g. "HardWalletPage"


  const {
    keyrings,
    walletProviders,
    showNewAccountPage, // needed thus onClick event fires properly
  } = this.props

  var temp=[];
  Object.keys(walletProviders).map((key, index) => {

    const {func, text, img} = walletProviders[key];

    temp.push(
      h(Item, {
        onClick: () => showNewAccountPage(func),
        icon: h('img.account-menu__item-icon', { src: img }),
        text: t(text),
      })
    )    
  })

  return temp;

  // The techniques used here will be applied similar to the other  places, increasing
  // step by step the abstract/generic nature of the keyrings/ui interaction

  // Pass2: once the 2 keyrings work fine, add a dummy-keyring to "play" a bit around
  // Pass3: add ledger-keyring (should be trivial at this point, or at lest should have
  //        reduced effort.
}

/**
 * TODO
 */
AccountMenu.prototype.renderAccounts = function () {
  const {
    identities,
    accounts,
    selectedAddress,
    keyrings,
    showAccountDetail,
  } = this.props

  return Object.keys(identities).map((key, index) => {
    const identity = identities[key]
    const isSelected = identity.address === selectedAddress

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
          isSelected ? h('div.account-menu__check-mark-icon') : null,
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

/**
 * TODO
 * 
 * @param {*} keyring 
 */
AccountMenu.prototype.indicateIfLoose = function (keyring) {
  try { // Sometimes keyrings aren't loaded yet:
    const type = keyring.type
    const isLoose = type !== 'HD Key Tree'
    return isLoose ? h('.keyring-label.allcaps', t('imported')) : null
  } catch (e) { return }
}
