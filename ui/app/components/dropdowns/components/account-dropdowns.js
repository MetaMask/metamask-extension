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
const { formatBalance } = require('../../../util')

class AccountDropdowns extends Component {
  constructor (props) {
    super(props)
    this.state = {
      accountSelectorActive: false,
      optionsMenuActive: false,
    }
    // Used for orangeaccount selector icon
    // this.accountSelectorToggleClassName = 'accounts-selector'
    this.accountSelectorToggleClassName = 'fa-angle-down'
    this.optionsMenuToggleClassName = 'fa-ellipsis-h'
  }

  renderAccounts () {
    const { identities, accounts, selected, menuItemStyles, actions, keyrings } = this.props

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
              width: '260px',
            },
            menuItemStyles,
          ),
        },
        [
          h('div.flex-row.flex-center', {}, [

            h('span', {
              style: {
                flex: '1 1 0',
                minWidth: '20px',
                minHeight: '30px',
              },
            }, [
              h('span', {
                style: {
                  flex: '1 1 auto',
                  fontSize: '14px',
                },
              }, isSelected ? h('i.fa.fa-check') : null),
            ]),

            h(
              Identicon,
              {
                address: identity.address,
                diameter: 24,
                style: {
                  flex: '1 1 auto',
                  marginLeft: '10px',
                },
              },
            ),

            h('span.flex-column', {
              style: {
                flex: '10 10 auto',
                width: '175px',
                alignItems: 'flex-start',
                justifyContent: 'center',
                marginLeft: '10px',
                position: 'relative',
              },
            }, [
              this.indicateIfLoose(keyring),
              h('span.account-dropdown-name', {
                style: {
                  fontSize: '18px',
                  maxWidth: '145px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                },
              }, identity.name || ''),

              h('span.account-dropdown-balance', {
                style: {
                  fontSize: '14px',
                  fontFamily: 'Avenir',
                  fontWeight: 500,
                },
              }, formattedBalance),
            ]),

            h('span', {
              style: {
                flex: '3 3 auto',
              },
            }, [
              h('span.account-dropdown-edit-button', {
                style: {
                  fontSize: '16px',
                },
                onClick: () => {
                  actions.showEditAccountModal(identity)
                },
              }, [
                'Edit',
              ]),
            ]),

          ]),
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
        ]
      )
    })
  }

  indicateIfLoose (keyring) {
    try { // Sometimes keyrings aren't loaded yet:
      const type = keyring.type
      const isLoose = type !== 'HD Key Tree'
      return isLoose ? h('.keyring-label', 'LOOSE') : null
    } catch (e) { return }
  }

  renderAccountSelector () {
    const { actions, useCssTransition, innerStyle, sidebarOpen } = this.props
    const { accountSelectorActive, menuItemStyles } = this.state

    return h(
      Dropdown,
      {
        useCssTransition,
        style: {
          marginLeft: '-185px',
          marginTop: '50px',
          minWidth: '180px',
          overflowY: 'auto',
          maxHeight: '300px',
          width: '300px',
        },
        innerStyle,
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
            style: Object.assign(
              {},
              menuItemStyles,
            ),
            onClick: () => actions.showNewAccountModal(),
          },
          [
            h(
              'i.fa.fa-plus.fa-lg',
              {
                style: {
                  marginLeft: '8px',
                },
              }
            ),
            h('span', {
              style: {
                marginLeft: '14px',
                fontFamily: 'DIN OT',
                fontSize: '16px',
                lineHeight: '23px',
              },
            }, 'Create Account'),
          ],
        ),
        h(
          DropdownMenuItem,
          {
            closeMenu: () => {
              if (sidebarOpen) {
                actions.hideSidebar()
              }
            },
            onClick: () => actions.showImportPage(),
            style: Object.assign(
              {},
              menuItemStyles,
            ),
          },
          [
            h(
              'i.fa.fa-download.fa-lg',
              {
                style: {
                  marginLeft: '8px',
                },
              }
            ),
            h('span', {
              style: {
                marginLeft: '20px',
                marginBottom: '5px',
                fontFamily: 'DIN OT',
                fontSize: '16px',
                lineHeight: '23px',
              },
            }, 'Import Account'),
          ]
        ),
      ]
    )
  }

  renderAccountOptions () {
    const { actions, dropdownWrapperStyle, useCssTransition } = this.props
    const { optionsMenuActive, menuItemStyles } = this.state
    const dropdownMenuItemStyle = {
      fontFamily: 'DIN OT',
      fontSize: 16,
      lineHeight: '24px',
      padding: '8px',
    }

    return h(
      Dropdown,
      {
        useCssTransition,
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
              this.props.actions.showAccountDetailModal()
            },
            style: Object.assign(
              dropdownMenuItemStyle,
              menuItemStyles,
            ),
          },
          'Account Details',
        ),
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
              dropdownMenuItemStyle,
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
              const { selected } = this.props
              const checkSumAddress = selected && ethUtil.toChecksumAddress(selected)
              copyToClipboard(checkSumAddress)
            },
            style: Object.assign(
              dropdownMenuItemStyle,
              menuItemStyles,
            ),
          },
          'Copy Address to clipboard',
        ),
        h(
          DropdownMenuItem,
          {
            closeMenu: () => {},
            onClick: () => this.props.actions.showExportPrivateKeyModal(),
            style: Object.assign(
              dropdownMenuItemStyle,
              menuItemStyles,
            ),
          },
          'Export Private Key',
        ),
        h(
          DropdownMenuItem,
          {
            closeMenu: () => {},
            onClick: () => {
              actions.hideSidebar()
              actions.showAddTokenPage()
            },
            style: Object.assign(
              dropdownMenuItemStyle,
              menuItemStyles,
            ),
          },
          'Add Token',
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
          'i.fa.fa-angle-down',
          {
            style: {
              cursor: 'pointer',
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
              cursor: 'pointer',
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
  selected: PropTypes.string,
  keyrings: PropTypes.array,
  accounts: PropTypes.object,
  menuItemStyles: PropTypes.object,
  actions: PropTypes.object,
  // actions.showAccountDetail: ,
  useCssTransition: PropTypes.bool,
  innerStyle: PropTypes.object,
  sidebarOpen: PropTypes.bool,
  dropdownWrapperStyle: PropTypes.string,
  // actions.showAccountDetailModal: ,
  network: PropTypes.number,
  // actions.showExportPrivateKeyModal: ,
  style: PropTypes.object,
  enableAccountsSelector: PropTypes.bool,
  enableAccountOption: PropTypes.bool,
  enableAccountOptions: PropTypes.bool,
}

const mapDispatchToProps = (dispatch) => {
  return {
    actions: {
      hideSidebar: () => dispatch(actions.hideSidebar()),
      showConfigPage: () => dispatch(actions.showConfigPage()),
      showAccountDetail: (address) => dispatch(actions.showAccountDetail(address)),
      showAccountDetailModal: () => {
        dispatch(actions.showModal({ name: 'ACCOUNT_DETAILS' }))
      },
      showEditAccountModal: (identity) => {
        dispatch(actions.showModal({
          name: 'EDIT_ACCOUNT_NAME',
          identity,
        }))
      },
      showNewAccountModal: () => {
        dispatch(actions.showModal({ name: 'NEW_ACCOUNT' }))
      },
      showExportPrivateKeyModal: () => {
        dispatch(actions.showModal({ name: 'EXPORT_PRIVATE_KEY' }))
      },
      showAddTokenPage: () => {
        dispatch(actions.showAddTokenPage())
      },
      addNewAccount: () => dispatch(actions.addNewAccount()),
      showImportPage: () => dispatch(actions.showImportPage()),
      showQrView: (selected, identity) => dispatch(actions.showQrView(selected, identity)),
    },
  }
}

function mapStateToProps (state) {
  return {
    keyrings: state.metamask.keyrings,
    sidebarOpen: state.appState.sidebarOpen,
  }
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(AccountDropdowns)

