import React, { Component } from 'react'
import PropTypes from 'prop-types'
import AccountModalContainer from '../account-modal-container'
import genAccountLink from '../../../../../lib/account-link.js'
import QrView from '../../../ui/qr-code'
import EditableLabel from '../../../ui/editable-label'
import Button from '../../../ui/button'

export default class AccountDetailsModal extends Component {
  static propTypes = {
    testnetBase32Address: PropTypes.string.isRequired,
    mainnetBase32Address: PropTypes.string.isRequired,
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

  render() {
    const {
      testnetBase32Address,
      mainnetBase32Address,
      selectedIdentity,
      network,
      showExportPrivateKeyModal,
      setAccountLabel,
      keyrings,
      rpcPrefs,
    } = this.props
    const { name, address, base32Address } = selectedIdentity
    const { t } = this.context

    const keyring = keyrings.find(kr => {
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

        <p
          style={{
            fontSize: '80%',
            color: '#0260A4',
            fontWeight: 'bold',
            textAlign: 'center',
            margin: 'auto',
            width: '90%',
            background: '#EAF6FF',
            border: '1px solid #75C4FD',
            borderRadius: '8px',
            padding: '8px',
            marginTop: '1rem',
            marginBottom: '1rem',
          }}
        >
          {' ' + t('base32AddressNotice')}
        </p>

        <QrView
          Qr={{
            noQr: true,
            data: base32Address,
            testnetBase32Address,
            mainnetBase32Address,
            network,
          }}
        />

        <div className="account-modal-divider" />

        <Button
          type="secondary"
          className="account-modal__button"
          onClick={() => {
            global.platform.openWindow({
              url: genAccountLink(address, network, rpcPrefs),
            })
          }}
        >
          {rpcPrefs.blockExplorerUrl
            ? this.context.t('blockExplorerView', [
                rpcPrefs.blockExplorerUrl.match(/^https?:\/\/(.+)/)[1],
              ])
            : this.context.t('viewOnEtherscan')}
        </Button>

        {exportPrivateKeyFeatureEnabled ? (
          <Button
            type="secondary"
            className="account-modal__button"
            onClick={() => showExportPrivateKeyModal()}
          >
            {this.context.t('exportPrivateKey')}
          </Button>
        ) : null}
      </AccountModalContainer>
    )
  }
}
