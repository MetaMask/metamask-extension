import React, { Component } from 'react'
const PropTypes = require('prop-types')
const { compose } = require('recompose')
const { withRouter } = require('react-router-dom')
const inherits = require('util').inherits
const connect = require('react-redux').connect
const actions = require('../../../store/actions')
const { getSelectedIdentity, getRpcPrefsForCurrentProvider } = require('../../../selectors/selectors')
const { CONNECTED_ROUTE } = require('../../../helpers/constants/routes')
const genAccountLink = require('../../../../lib/account-link.js')
const { Menu, Item, CloseArea } = require('./components/menu')

AccountDetailsDropdown.contextTypes = {
  t: PropTypes.func,
  metricsEvent: PropTypes.func,
}

module.exports = compose(withRouter, connect(mapStateToProps, mapDispatchToProps))(AccountDetailsDropdown)

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

AccountDetailsDropdown.prototype.render = function AccountDetailsDropdown () {
  const {
    selectedIdentity,
    network,
    keyrings,
    showAccountDetailModal,
    viewOnEtherscan,
    showRemoveAccountConfirmationModal,
    rpcPrefs,
    history,
  } = this.props

  const address = selectedIdentity.address

  const keyring = keyrings.find((kr) => {
    return kr.accounts.includes(address)
  })

  const isRemovable = keyring.type !== 'HD Key Tree'

  return (
    <Menu className="account-details-dropdown" isShowing>
      <CloseArea onClick={this.onClose} />
      <Item
        onClick={(e) => {
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
        }}
        text={this.context.t('expandView')}
        icon={(
          <img alt="" src="images/expand.svg" style={{ height: '15px' }} />
        )}
      />
      <Item
        onClick={(e) => {
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
        }}
        text={this.context.t('accountDetails')}
        icon={(
          <img src="images/info.svg" style={{ height: '15px' }} alt="" />
        )}
      />
      <Item
        onClick={(e) => {
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
        }}
        text={
          rpcPrefs.blockExplorerUrl
            ? this.context.t('viewinExplorer')
            : this.context.t('viewOnEtherscan')
        }
        subText={
          rpcPrefs.blockExplorerUrl
            ? rpcPrefs.blockExplorerUrl.match(/^https?:\/\/(.+)/)[1]
            : null
        }
        icon={(
          <img src="images/open-etherscan.svg" style={{ height: '15px' }} alt="" />
        )}
      />
      <Item
        onClick={(e) => {
          e.stopPropagation()
          this.context.metricsEvent({
            eventOpts: {
              category: 'Navigation',
              action: 'Account Options',
              name: 'Opened Connected Sites',
            },
          })
          history.push(CONNECTED_ROUTE)
        }}
        text={this.context.t('connectedSites')}
        icon={(
          <img src="images/connect-white.svg" style={{ height: '15px' }} alt="" />
        )}
      />
      {
        isRemovable
          ? (
            <Item
              onClick={(e) => {
                e.stopPropagation()
                showRemoveAccountConfirmationModal(selectedIdentity)
                this.props.onClose()
              }}
              text={this.context.t('removeAccount')}
              icon={<img src="images/hide.svg" style={{ height: '15px' }} alt="" />}
            />
          )
          : null
      }
    </Menu>
  )
}
