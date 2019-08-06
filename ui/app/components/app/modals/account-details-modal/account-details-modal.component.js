import React, { Component} from 'react'
import PropTypes from 'prop-types'
import AccountModalContainer from '../account-modal-container'
import genAccountLink from '../../../../../lib/account-link.js'
import QrView from '../../../ui/qr-code'
import EditableLabel from '../../../ui/editable-label'
import Button from '../../../ui/button'

export default class AccountDetailsModal extends Component {
  static propTypes = {
    selectedIdentity: PropTypes.object,
    network: PropTypes.string,
    showExportPrivateKeyModal: PropTypes.func,
    setAccountLabel: PropTypes.func,
    keyrings: PropTypes.array,
    rpcPrefs: PropTypes.object,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  render () {
    const {
      selectedIdentity,
      network,
      showExportPrivateKeyModal,
      setAccountLabel,
      keyrings,
      rpcPrefs,
    } = this.props
    const { name, address } = selectedIdentity

    const keyring = keyrings.find((kr) => {
      return kr.accounts.includes(address)
    })

    let exportPrivateKeyFeatureEnabled = true
    // This feature is disabled for hardware wallets
    if (keyring && keyring.type.search('Hardware') !== -1) {
      exportPrivateKeyFeatureEnabled = false
    }

    return (
      <AccountModalContainer>
        <EditableLabel
          className="account-modal__name"
          defaultValue={name}
          onSubmit={label => setAccountLabel(address, label)}
        />

        <QrView
          Qr={{
            data: address,
            network: network,
          }}
        />

        <div className="account-modal-divider"/>

        <Button
          type="secondary"
          className="account-modal__button"
          onClick={() => {
            global.platform.openWindow({ url: genAccountLink(address, network, rpcPrefs) })
          }}
        >
          {rpcPrefs.blockExplorerUrl
            ? this.context.t('blockExplorerView', [rpcPrefs.blockExplorerUrl.match(/^https?:\/\/(.+)/)[1]])
            : this.context.t('viewOnEtherscan')
          }
        </Button>

        {exportPrivateKeyFeatureEnabled
          ? <Button
            type="secondary"
            className="account-modal__button"
            onClick={() => showExportPrivateKeyModal()}
          >
            {this.context.t('exportPrivateKey')}
          </Button>
          : null
        }
      </AccountModalContainer>
    )
  }
}
