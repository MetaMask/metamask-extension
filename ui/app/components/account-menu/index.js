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

// identities, accounts, selected, menuItemStyles, actions, keyrings

function mapDispatchToProps (dispatch) {
  return {
    toggleAccountMenu: () => dispatch(actions.toggleAccountMenu()),
  }
}

AccountMenu.prototype.render = function () {
  const { isAccountMenuOpen, toggleAccountMenu } = this.props

  return h(Menu, { className: 'account-menu', isShowing: isAccountMenuOpen }, [
    h(CloseArea, { onClick: toggleAccountMenu }),
    h(Item, { className: 'account-menu__header' }, [
      'My Accounts',
      h('button.account-menu__logout-button', 'Log out'),
    ]),
    h(Divider),
    h('div.account-menu__accounts', this.renderAccounts()),
    h(Divider),
    h(Item, {
      onClick: true,
      icon: h('img', { src: 'images/plus-btn-white.svg' }),
      text: 'Create Account',
    }),
    h(Item, {
      onClick: true,
      icon: h('img', { src: 'images/import-account.svg' }),
      text: 'Import Account',
    }),
    h(Divider),
    h(Item, {
      onClick: true,
      icon: h('img', { src: 'images/mm-info-icon.svg' }),
      text: 'Info & Help',
    }),
    h(Item, {
      onClick: true,
      icon: h('img', { src: 'images/settings.svg' }),
      text: 'Settings',
    }),
  ])
}

AccountMenu.prototype.renderAccounts = function () {
  const { identities, accounts, selected, actions, keyrings } = this.props

  return Object.keys(identities).map((key, index) => {
    const identity = identities[key]
    const isSelected = identity.address === selected

    const balanceValue = accounts[key].balance
    const formattedBalance = balanceValue ? formatBalance(balanceValue, 6) : '...'
    const simpleAddress = identity.address.substring(2).toLowerCase()

    const keyring = keyrings.find((kr) => {
      return kr.accounts.includes(simpleAddress) ||
        kr.accounts.includes(identity.address)
    })

    return h(
      'div.account-menu__account',
      {
        onClick: () => {
          this.props.actions.showAccountDetail(identity.address)
        },
      },
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

          this.indicateIfLoose(keyring),

          h('div.account-menu__name', {
            style: {
              fontSize: '18px',
              maxWidth: '145px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            },
          }, identity.name || ''),

          h('div.account-menu__balance', formattedBalance),
        ]),

        h('div.account-menu__action', {
          onClick: () => {
            actions.showEditAccountModal(identity)
          },
        }, 'Edit'),

// =======
//             },
//           ),
//           this.indicateIfLoose(keyring),
//           h('span', {
//             style: {
//               marginLeft: '20px',
//               fontSize: '24px',
//               maxWidth: '145px',
//               whiteSpace: 'nowrap',
//               overflow: 'hidden',
//               textOverflow: 'ellipsis',
//             },
//           }, identity.name || ''),
//           h('span', { style: { marginLeft: '20px', fontSize: '24px' } }, isSelected ? h('.check', '✓') : null),
// >>>>>>> master:ui/app/components/account-dropdowns.js
      ],
    )
  })
}

AccountMenu.prototype.indicateIfLoose = function (keyring) {
  try { // Sometimes keyrings aren't loaded yet:
    const type = keyring.type
    const isLoose = type !== 'HD Key Tree'
    return isLoose ? h('.keyring-label', 'LOOSE') : null
  } catch (e) { return }
}
