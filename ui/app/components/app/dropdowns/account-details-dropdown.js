const Component = require('react').Component
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const inherits = require('util').inherits
const connect = require('react-redux').connect
const actions = require('../../../store/actions')
const { getSelectedIdentity, getRpcPrefsForCurrentProvider } = require('../../../selectors/selectors')
const genAccountLink = require('../../../../lib/account-link.js')
const { Menu, Item, CloseArea } = require('./components/menu')

AccountDetailsDropdown.contextTypes = {
  t: PropTypes.func,
  metricsEvent: PropTypes.func,
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(AccountDetailsDropdown)

function mapStateToProps (state) {
  return {
    selectedIdentity: getSelectedIdentity(state),
    network: state.metamask.network,
    keyrings: state.metamask.keyrings,
    rpcPrefs: getRpcPrefsForCurrentProvider(state),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    showAccountDetailModal: () => {
      dispatch(actions.showModal({ name: 'ACCOUNT_DETAILS' }))
    },
    viewOnEtherscan: (address, network, rpcPrefs) => {
      global.platform.openWindow({ url: genAccountLink(address, network, rpcPrefs) })
    },
    showRemoveAccountConfirmationModal: (identity) => {
      return dispatch(actions.showModal({ name: 'CONFIRM_REMOVE_ACCOUNT', identity }))
    },
  }
}

inherits(AccountDetailsDropdown, Component)
function AccountDetailsDropdown () {
  Component.call(this)

  this.onClose = this.onClose.bind(this)
}

AccountDetailsDropdown.prototype.onClose = function (e) {
  e.stopPropagation()
  this.props.onClose()
}

AccountDetailsDropdown.prototype.render = function () {
  const {
    selectedIdentity,
    network,
    keyrings,
    showAccountDetailModal,
    viewOnEtherscan,
    showRemoveAccountConfirmationModal,
    rpcPrefs,
  } = this.props

  const address = selectedIdentity.address

  const keyring = keyrings.find((kr) => {
    return kr.accounts.includes(address)
  })

  const isRemovable = keyring.type !== 'HD Key Tree'

  return h(Menu, { className: 'account-details-dropdown', isShowing: true }, [
    h(CloseArea, {
      onClick: this.onClose,
    }),
    h(Item, {
      onClick: (e) => {
        e.stopPropagation()
        this.context.metricsEvent({
          eventOpts: {
            category: 'Navigation',
            action: 'Account Options',
            name: 'Clicked Expand View',
          },
        })
        global.platform.openExtensionInBrowser()
        this.props.onClose()
      },
      text: this.context.t('expandView'),
      icon: h(`img`, { src: 'images/expand.svg', style: { height: '15px' } }),
    }),
    h(Item, {
      onClick: (e) => {
        e.stopPropagation()
        showAccountDetailModal()
        this.context.metricsEvent({
          eventOpts: {
            category: 'Navigation',
            action: 'Account Options',
            name: 'Viewed Account Details',
          },
        })
        this.props.onClose()
      },
      text: this.context.t('accountDetails'),
      icon: h(`img`, { src: 'images/info.svg', style: { height: '15px' } }),
    }),
    h(Item, {
      onClick: (e) => {
        e.stopPropagation()
        this.context.metricsEvent({
          eventOpts: {
            category: 'Navigation',
            action: 'Account Options',
            name: 'Clicked View on Etherscan',
          },
        })
        viewOnEtherscan(address, network, rpcPrefs)
        this.props.onClose()
      },
      text: (rpcPrefs.blockExplorerUrl
        ? this.context.t('viewinExplorer')
        : this.context.t('viewOnEtherscan')),
      subText: (rpcPrefs.blockExplorerUrl
        ? rpcPrefs.blockExplorerUrl.match(/^https?:\/\/(.+)/)[1]
        : null),
      icon: h(`img`, { src: 'images/open-etherscan.svg', style: { height: '15px' } }),
    }),
    isRemovable ? h(Item, {
      onClick: (e) => {
        e.stopPropagation()
        showRemoveAccountConfirmationModal(selectedIdentity)
        this.props.onClose()
      },
      text: this.context.t('removeAccount'),
      icon: h(`img`, { src: 'images/hide.svg', style: { height: '15px' } }),
    }) : null,
  ])
}
