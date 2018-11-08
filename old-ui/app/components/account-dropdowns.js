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
    const { identities, selected, keyrings } = this.props
    const accountOrder = keyrings.reduce((list, keyring) => list.concat(keyring.accounts), [])

    return accountOrder.map((address, index) => {
      const identity = identities[address]
      const isSelected = identity.address === selected

      const simpleAddress = identity.address.substring(2).toLowerCase()

      const keyring = keyrings.find((kr) => {
        return kr.accounts.includes(simpleAddress) ||
          kr.accounts.includes(identity.address)
      })

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
          this.ifLooseAcc(keyring) ? h('.remove', {
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
    })
  }

  ifLooseAcc (keyring) {
    try { // Sometimes keyrings aren't loaded yet:
      const type = keyring.type
      const isLoose = type !== 'HD Key Tree'
      return isLoose
    } catch (e) { return }
  }

  indicateIfLoose (keyring) {
    return this.ifLooseAcc(keyring) ? h('.keyring-label', 'IMPORTED') : null
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
    const { actions } = this.props
    const { optionsMenuActive } = this.state

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
        h(
          DropdownMenuItem,
          {
            closeMenu: () => {},
            onClick: () => {
              actions.requestAccountExport()
            },
          },
          'Export Private Key',
        ),
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
