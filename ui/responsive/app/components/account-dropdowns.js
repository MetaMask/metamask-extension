const Component = require('react').Component
const PropTypes = require('react').PropTypes
const h = require('react-hyperscript')
const actions = require('../actions')
const genAccountLink = require('../../lib/account-link.js')
const connect = require('react-redux').connect
const Dropdown = require('./dropdown').Dropdown
const DropdownMenuItem = require('./dropdown').DropdownMenuItem
const Identicon = require('./identicon')
const ethUtil = require('ethereumjs-util')
const copyToClipboard = require('copy-to-clipboard')

class AccountDropdowns extends Component {
  constructor (props) {
    super(props)
    this.state = {
      overflowMenuActive: false,
      switchingMenuActive: false,
    }
  }

  getAccounts () {
    const { identities, selected } = this.props

    return Object.keys(identities).map((key) => {
      const identity = identities[key]
      const isSelected = identity.address === selected

      return h(
        DropdownMenuItem,
        {
          closeMenu: () => {},
          onClick: () => {
            this.props.actions.showAccountDetail(identity.address)
          },
        },
        [
          h(
            Identicon,
            {
              address: identity.address,
              diameter: 16,
            },
          ),
          h('span', { style: { marginLeft: '10px' } }, identity.name || ''),
          h('span', { style: { marginLeft: '10px' } }, isSelected ? h('.check', '✓') : null),
        ]
      )
    })
  }

  render () {
    const { style, actions } = this.props
    const { switchingMenuActive, overflowMenuActive } = this.state

    return h(
      'span',
      {
        style: style,
      },
      [
        h(
          'i.fa.fa-angle-down',
          {
            style: {},
            onClick: (event) => {
              event.stopPropagation()
              this.setState({
                switchingMenuActive: !switchingMenuActive,
                overflowMenuActive: false,
              })
            },
          },
          [
            h(
              Dropdown,
              {
                style: {
                  marginLeft: '-140px',
                  minWidth: '180px',
                },
                isOpen: switchingMenuActive,
                onClickOutside: () => { this.setState({ switchingMenuActive: false}) },
              },
              [
                h(
                  DropdownMenuItem,
                  {
                    closeMenu: () => {},
                    onClick: () => actions.showConfigPage(),
                  },
                  'Account Settings',
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
                  },
                  'Export Private Key',
                ),
              ]
            ),
          ],
        ),
        h(
          'i.fa.fa-ellipsis-h',
          {
            style: { 'marginLeft': '10px'},
            onClick: (event) => {
              event.stopPropagation()
              this.setState({
                overflowMenuActive: !overflowMenuActive,
                switchingMenuActive: false,
              })
            },
          },
          [
            h(
              Dropdown,
              {
                style: {
                  marginLeft: '-155px',
                  minWidth: '180px',
                },
                isOpen: overflowMenuActive,
                onClickOutside: () => { this.setState({ overflowMenuActive: false}) },
              },
              [
                ...this.getAccounts(),
                h(
                  DropdownMenuItem,
                  {
                    closeMenu: () => {},
                    onClick: () => actions.addNewAccount(),
                  },
                  [
                    h(
                      Identicon,
                      {
                        diameter: 16,
                      },
                    ),
                    h('span', { style: { marginLeft: '10px' } }, 'Create Account'),
                  ],
                ),
                h(
                  DropdownMenuItem,
                  {
                    closeMenu: () => {},
                    onClick: () => actions.showImportPage(),
                  },
                  [
                    h(
                      Identicon,
                      {
                        diameter: 16,
                      },
                    ),
                    h('span', { style: { marginLeft: '10px' } }, 'Import Account'),
                  ]
                ),
              ]
            ),
          ]
        ),
      ]
    )
  }
}

AccountDropdowns.propTypes = {
  identities: PropTypes.objectOf(PropTypes.object),
  selected: PropTypes.string,
}

const mapDispatchToProps = (dispatch) => {
  return {
    actions: {
      showConfigPage: () => dispatch(actions.showConfigPage()),
      requestAccountExport: () => dispatch(actions.requestExportAccount()),
      showAccountDetail: (address) => dispatch(actions.showAccountDetail(address)),
      addNewAccount: () => dispatch(actions.addNewAccount()),
      showImportPage: () => dispatch(actions.showImportPage()),
    },
  }
}

module.exports = {
  AccountDropdowns: connect(null, mapDispatchToProps)(AccountDropdowns),
}
