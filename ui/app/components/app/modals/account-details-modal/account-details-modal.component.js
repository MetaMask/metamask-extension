import React, { Component } from 'react'
import PropTypes from 'prop-types'
import AccountModalContainer from '../account-modal-container'
import getAccountLink from '../../../../../lib/account-link'
import QrView from '../../../ui/qr-code'
import EditableLabel from '../../../ui/editable-label'
import Button from '../../../ui/button'

export default class AccountDetailsModal extends Component {
  static propTypes = {
    selectedIdentity: PropTypes.object,
    network: PropTypes.string,
    setAccountLabel: PropTypes.func,
    rpcPrefs: PropTypes.object,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  render() {
    const {
      selectedIdentity,
      network,
      setAccountLabel,
      rpcPrefs,
    } = this.props
    const { name, address } = selectedIdentity

    return (
      <AccountModalContainer className="account-details-modal">
        <EditableLabel
          className="account-details-modal__name"
          defaultValue={name}
          onSubmit={(label) => setAccountLabel(address, label)}
        />

        <QrView
          Qr={{
            data: address,
          }}
        />

        <div className="account-details-modal__divider" />

        <Button
          type="secondary"
          className="account-details-modal__button"
          onClick={() => {
            global.platform.openTab({
              url: getAccountLink(address, network, rpcPrefs),
            })
          }}
        >
          {rpcPrefs.blockExplorerUrl
            ? this.context.t('blockExplorerView', [
                rpcPrefs.blockExplorerUrl.match(/^https?:\/\/(.+)/u)[1],
              ])
            : this.context.t('viewOnEtherscan')}
        </Button>
      </AccountModalContainer>
    )
  }
}
