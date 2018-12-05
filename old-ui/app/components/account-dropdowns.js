const Component = require('react').Component
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const actions = require('../../../ui/app/actions')
const connect = require('react-redux').connect
const Dropdown = require('./dropdown').Dropdown
const DropdownMenuItem = require('./dropdown').DropdownMenuItem
const Identicon = require('./identicon')
const ethUtil = require('ethereumjs-util')
const copyToClipboard = require('copy-to-clipboard')
const ethNetProps = require('eth-net-props')
const { getCurrentKeyring, ifLooseAcc, ifContractAcc } = require('../util')

class AccountDropdowns extends Component {
  constructor (props) {
    super(props)
    this.state = {
      accountSelectorActive: false,
      optionsMenuActive: false,
    }
    this.accountSelectorToggleClassName = 'accounts-selector'
    this.optionsMenuToggleClassName = 'account-dropdown'
  }

  renderAccounts () {
      const { identities, selected, keyrings, network } = this.props
      const accountOrder = keyrings.reduce((list, keyring) => {
        if (ifContractAcc(keyring) && keyring.network === network) {
          list = list.concat(keyring.accounts)
        } else if (!ifContractAcc(keyring)) {
          list = list.concat(keyring.accounts)
        }
        return list
      }, [])

      return accountOrder.map((address, index) => {
        const identity = identities[address]
        if (!identity) {
          return null
        }
        const isSelected = identity.address === selected

        const keyring = getCurrentKeyring(address, network, keyrings, identities)

        // display contract acc only for network where it was created
        if (ifContractAcc(keyring)) {
          if (keyring.network !== network) {
            return null
          } else {
            return this.accountsDropdownItemView(index, isSelected, keyring, identity)
          }
        } else {
          return this.accountsDropdownItemView(index, isSelected, keyring, identity)
        }
      })
  }

  accountsDropdownItemView (index, isSelected, keyring, identity) {
    return h(
        DropdownMenuItem,
        {
          closeMenu: () => {},
          onClick: () => {
            this.props.actions.showAccountDetail(identity.address)
          },
          style: {
            marginTop: index === 0 ? '5px' : '',
            fontSize: '16px',
            padding: '8px 0px',
          },
        },
        [
          isSelected ? h('div', {
            style: {
              width: '4px',
              height: '26px',
              background: '#60db97',
              position: 'absolute',
              left: '-25px',
            },
          }) : null,
          h(
            Identicon,
            {
              overflow: 'none',
              address: identity.address,
              diameter: 24,
              style: {
                marginLeft: '10px',
              },
            },
          ),
          h('span', {
            style: {
              marginLeft: '10px',
              fontSize: '16px',
              maxWidth: '95px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              color: isSelected ? 'white' : '',
            },
          }, identity.name || ''),
          this.indicateIfLoose(keyring),
          ifLooseAcc(keyring) ? h('.remove', {
            onClick: (event) => {
              event.preventDefault()
              event.stopPropagation()
              this.props.actions.showDeleteImportedAccount(identity)
              this.setState({
                accountSelectorActive: false,
                optionsMenuActive: false,
              })
            },
          }) : null,
        ]
      )
  }

  ifHardwareAcc (address) {
    const keyring = getCurrentKeyring(address, this.props.network, this.props.keyrings, this.props.identities)
    if (keyring && keyring.type.search('Hardware') !== -1) {
      return true
    }
    return false
  }

  indicateIfLoose (keyring) {
    if (ifLooseAcc(keyring)) {
      let label
      if (ifContractAcc(keyring)) {
        label = 'CONTRACT'
      } else {
        label = 'IMPORTED'
      }
      return h('.keyring-label', label)
    }

    return null
  }

  renderAccountSelector () {
    const { actions } = this.props
    const { accountSelectorActive } = this.state

    return h(
      Dropdown,
      {
        useCssTransition: true, // Hardcoded because account selector is temporarily in app-header
        style: {
          position: 'absolute',
          marginLeft: '-213px',
          top: '38px',
          minWidth: '180px',
          maxHeight: accountSelectorActive ? '300px' : '0px',
          width: '265px',
        },
        innerStyle: {
          padding: '8px 25px',
        },
        isOpen: accountSelectorActive,
        onClickOutside: (event) => {
          const { classList } = event.target
          const isNotToggleElement = !classList.contains(this.accountSelectorToggleClassName)
          if (accountSelectorActive && isNotToggleElement) {
            this.setState({ accountSelectorActive: false })
          }
        },
      },
      [
        ...this.renderAccounts(),
        h(
          DropdownMenuItem,
          {
            style: {
              padding: '8px 0px',
            },
            closeMenu: () => {},
            onClick: () => actions.addNewAccount(),
          },
          [
            h('span', { style: { fontSize: '16px', color: '#60db97' } }, 'Create Account'),
          ],
        ),
        h(
          DropdownMenuItem,
          {
            style: {
              padding: '8px 0px',
            },
            closeMenu: () => {},
            onClick: () => actions.showImportPage(),
          },
          [
            h('span', {
              style: {
                fontSize: '16px',
                marginBottom: '5px',
                color: '#60db97',
              },
            }, 'Import Account'),
          ]
        ),
        h(
          DropdownMenuItem,
          {
            style: {
              padding: '8px 0px',
            },
            closeMenu: () => {},
            onClick: () => actions.showConnectHWWalletPage(),
          },
          [
            h('span', {
              style: {
                fontSize: '16px',
                marginBottom: '5px',
                color: '#60db97',
              },
            }, 'Connect hardware wallet'),
          ]
        ),
      ]
    )
  }

  renderAccountOptions () {
    const { actions, selected, network, keyrings, identities } = this.props
    const { optionsMenuActive } = this.state

    const keyring = getCurrentKeyring(selected, network, keyrings, identities)

    return h(
      Dropdown,
      {
        style: {
          position: 'relative',
          marginLeft: '-234px',
          minWidth: '180px',
          // marginTop: '30px',
          top: '30px',
          width: '280px',
        },
        isOpen: optionsMenuActive,
        onClickOutside: (event) => {
          const { classList } = event.target
          const isNotToggleElement = !classList.contains(this.optionsMenuToggleClassName)
          if (optionsMenuActive && isNotToggleElement) {
            this.setState({ optionsMenuActive: false })
          }
        },
      },
      [
        h(
          DropdownMenuItem,
          {
            closeMenu: () => {},
            onClick: () => {
              const { selected, network } = this.props
              const url = ethNetProps.explorerLinks.getExplorerAccountLinkFor(selected, network)
              global.platform.openWindow({ url })
            },
          },
          `View on block explorer`,
        ),
        h(
          DropdownMenuItem,
          {
            closeMenu: () => {},
            onClick: () => {
              const { selected, identities } = this.props
              var identity = identities[selected]
              actions.showQrView(selected, identity ? identity.name : '')
            },
          },
          'Show QR Code',
        ),
        h(
          DropdownMenuItem,
          {
            closeMenu: () => {},
            onClick: () => {
              const { selected } = this.props
              const checkSumAddress = selected && ethUtil.toChecksumAddress(selected)
              copyToClipboard(checkSumAddress)
            },
          },
          'Copy address to clipboard',
        ),
        (!this.ifHardwareAcc(selected) && !(ifContractAcc(keyring))) ? h(
          DropdownMenuItem,
          {
            closeMenu: () => {},
            onClick: () => {
              actions.requestAccountExport()
            },
          },
          'Export Private Key',
        ) : null,
      ]
    )
  }

  render () {
    const { style, enableAccountsSelector, enableAccountOptions } = this.props
    const { optionsMenuActive, accountSelectorActive } = this.state

    return h(
      'span',
      {
        style: style,
      },
      [
        enableAccountsSelector && h(
          'div.accounts-selector',
          {
            style: {
              background: 'url(images/switch_acc.svg) white center center no-repeat',
              height: '25px',
              width: '25px',
              marginRight: '3px',
            },
            onClick: (event) => {
              event.stopPropagation()
              this.setState({
                accountSelectorActive: !accountSelectorActive,
                optionsMenuActive: false,
              })
            },
          },
          this.renderAccountSelector(),
        ),
        enableAccountOptions && h(
          'div.address-dropdown.account-dropdown',
          {
            onClick: (event) => {
              event.stopPropagation()
              this.setState({
                accountSelectorActive: false,
                optionsMenuActive: !optionsMenuActive,
              })
            },
          },
          this.renderAccountOptions()
        ),
      ]
    )
  }

  // switch to the first account in the list on network switch, if unlocked account was contract before change
  componentDidUpdate (prevProps) {
    if (!isNaN(this.props.network)) {
      const { selected, network, keyrings, identities } = this.props
      if (network !== prevProps.network) {
        const keyring = getCurrentKeyring(selected, this.props.network, keyrings, identities)
        const firstKeyring = keyrings && keyrings[0]
        const firstKeyRingAcc = firstKeyring && firstKeyring.accounts && firstKeyring.accounts[0]
        if (!keyring || (ifContractAcc(keyring) && firstKeyRingAcc)) {
          return this.props.actions.showAccountDetail(firstKeyRingAcc)
        }
      }
    }
  }
}

AccountDropdowns.defaultProps = {
  enableAccountsSelector: false,
  enableAccountOptions: false,
}

AccountDropdowns.propTypes = {
  identities: PropTypes.objectOf(PropTypes.object),
  selected: PropTypes.string,
  keyrings: PropTypes.array,
  actions: PropTypes.objectOf(PropTypes.func),
  network: PropTypes.string,
  style: PropTypes.object,
  enableAccountOptions: PropTypes.bool,
  enableAccountsSelector: PropTypes.bool,
}

const mapDispatchToProps = (dispatch) => {
  return {
    actions: {
      showConfigPage: () => dispatch(actions.showConfigPage()),
      requestAccountExport: () => dispatch(actions.requestExportAccount()),
      showAccountDetail: (address) => dispatch(actions.showAccountDetail(address)),
      addNewAccount: () => dispatch(actions.addNewAccount()),
      showImportPage: () => dispatch(actions.showImportPage()),
      showConnectHWWalletPage: () => dispatch(actions.showConnectHWWalletPage()),
      showQrView: (selected, identity) => dispatch(actions.showQrView(selected, identity)),
      showDeleteImportedAccount: (identity) => dispatch(actions.showDeleteImportedAccount(identity)),
    },
  }
}

module.exports = {
  AccountDropdowns: connect(null, mapDispatchToProps)(AccountDropdowns),
}
