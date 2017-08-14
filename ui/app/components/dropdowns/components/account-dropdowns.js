const Component = require('react').Component
const PropTypes = require('react').PropTypes
const h = require('react-hyperscript')
const actions = require('../../../actions')
const genAccountLink = require('../../../../lib/account-link.js')
const connect = require('react-redux').connect
const Dropdown = require('./dropdown').Dropdown
const DropdownMenuItem = require('./dropdown').DropdownMenuItem
const Identicon = require('../../identicon')
const ethUtil = require('ethereumjs-util')
const copyToClipboard = require('copy-to-clipboard')

class AccountDropdowns extends Component {
  constructor (props) {
    super(props)
    this.state = {
      accountSelectorActive: false,
      optionsMenuActive: false,
    }
    this.accountSelectorToggleClassName = 'accounts-selector'
    this.optionsMenuToggleClassName = 'fa-ellipsis-h'
  }

  renderAccounts () {
    const { identities, selected, menuItemStyles, dropdownWrapperStyle } = this.props

    return Object.keys(identities).map((key, index) => {
      const identity = identities[key]
      const isSelected = identity.address === selected

      return h(
        DropdownMenuItem,
        {
          closeMenu: () => {},
          onClick: () => {
            this.props.actions.showAccountDetail(identity.address)
          },
          style: Object.assign(
            {
              marginTop: index === 0 ? '5px' : '',
              fontSize: '24px',
            },
            menuItemStyles,
          ),
        },
        [
          h(
            Identicon,
            {
              address: identity.address,
              diameter: 32,
              style: {
                marginLeft: '10px',
              },
            },
          ),
          h('span', { style: { marginLeft: '20px', fontSize: '24px' } }, identity.name || ''),
          h('span', { style: { marginLeft: '20px', fontSize: '24px' } }, isSelected ? h('.check', '✓') : null),
        ]
      )
    })
  }

  renderAccountSelector () {
    const { actions, dropdownWrapperStyle } = this.props
    const { accountSelectorActive, menuItemStyles } = this.state

    return h(
      Dropdown,
      {
        useCssTransition: true, // Hardcoded because account selector is temporarily in app-header
        style: {
          marginLeft: '-238px',
          marginTop: '38px',
          minWidth: '180px',
          overflowY: 'auto',
          maxHeight: '300px',
          width: '300px',
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
            closeMenu: () => {},
            onClick: () => actions.addNewAccount(),
            style: Object.assign(
              {},
              menuItemStyles,
            ),
          },
          [
            h(
              Identicon,
              {
                style: {
                  marginLeft: '10px',
                },
                diameter: 32,
              },
            ),
            h('span', { style: { marginLeft: '20px', fontSize: '24px' } }, 'Create Account'),
          ],
        ),
        h(
          DropdownMenuItem,
          {
            closeMenu: () => {},
            onClick: () => actions.showImportPage(),
            style: Object.assign(
              {},
              menuItemStyles,
            ),
          },
          [
            h(
              Identicon,
              {
                style: {
                  marginLeft: '10px',
                },
                diameter: 32,
              },
            ),
            h('span', {
              style: {
                marginLeft: '20px',
                fontSize: '24px',
                marginBottom: '5px',
              },
            }, 'Import Account'),
          ]
        ),
      ]
    )
  }

  renderAccountOptions () {
    const { actions, dropdownWrapperStyle } = this.props
    const { optionsMenuActive, menuItemStyles } = this.state

    return h(
      Dropdown,
      {
        style: Object.assign(
          {
            marginLeft: '-10px',
            position: 'absolute',
            width: '29vh', // affects both mobile and laptop views
          },
          dropdownWrapperStyle,
        ),
        isOpen: optionsMenuActive,
        onClickOutside: () => {
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
              const url = genAccountLink(selected, network)
              global.platform.openWindow({ url })
            },
            style: Object.assign(
              {},
              menuItemStyles,
            ),
          },
          'View account on Etherscan',
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
            style: Object.assign(
              {},
              menuItemStyles,
            ),
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
            style: Object.assign(
              {},
              menuItemStyles,
            ),
          },
          'Copy Address to clipboard',
        ),
        h(
          DropdownMenuItem,
          {
            closeMenu: () => {},
            onClick: () => {
              actions.requestAccountExport()
            },
            style: Object.assign(
              {},
              menuItemStyles,
            ),
          },
          'Export Private Key',
        ),
      ]
    )
  }

  render () {
    const { style, enableAccountsSelector, enableAccountOptions, dropdownWrapperStyle } = this.props
    const { optionsMenuActive, accountSelectorActive } = this.state

    return h(
      'span',
      {
        style: style,
      },
      [
        enableAccountsSelector && h(
          'i.fa.fa-angle-down',
          // 'div.cursor-pointer.color-orange.accounts-selector',
          {
            style: {
              // fontSize: '135%',
              // background: 'url(images/switch_acc.svg) white center center no-repeat',
              // height: '25px',
              // width: '25px',
              // transform: 'scale(0.75)',
              // marginRight: '3px',
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
          'i.fa.fa-ellipsis-h',
          {
            style: {
              fontSize: '135%',
            },
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
  selected: PropTypes.string, // TODO: refactor to be more explicit: selectedAddress
}

const mapDispatchToProps = (dispatch) => {
  return {
    actions: {
      showConfigPage: () => dispatch(actions.showConfigPage()),
      requestAccountExport: () => dispatch(actions.requestExportAccount()),
      showAccountDetail: (address) => dispatch(actions.showAccountDetail(address)),
      addNewAccount: () => dispatch(actions.addNewAccount()),
      showImportPage: () => dispatch(actions.showImportPage()),
      showQrView: (selected, identity) => dispatch(actions.showQrView(selected, identity)),
    },
  }
}

module.exports = connect(null, mapDispatchToProps)(AccountDropdowns)

