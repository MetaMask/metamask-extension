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

        <QrView
          Qr={{
            data: base32Address,
            testnetBase32Address,
            mainnetBase32Address,
            network,
          }}
        />

        <svg
          width="18px"
          height="16px"
          viewBox="0 0 18 16"
          style={{ marginTop: '10px' }}
        >
          <g
            id="Page-1"
            stroke="none"
            strokeWidth="1"
            fill="none"
            fillRule="evenodd"
          >
            <g
              id="iconfinder_101_Warning_183416"
              fill="#FF0000"
              fillRule="nonzero"
            >
              <path
                d="M7.90908418,0.795041135 C8.51143756,-0.179494782 9.48948092,-0.177172325 10.0903988,0.795041135 L17.5569992,12.8751092 C18.3611346,14.1761043 17.7753781,15.2307692 16.2494355,15.2307692 L1.75004751,15.2307692 C0.223764625,15.2307692 -0.364248575,14.180306 0.44248383,12.8751092 L7.90908418,0.795041135 Z M9,10.3846154 C9.38235095,10.3846154 9.69230769,10.0709749 9.69230769,9.69436378 L9.69230769,5.53640545 C9.69230769,5.15519003 9.38501668,4.84615385 9,4.84615385 C8.61764905,4.84615385 8.30769231,5.15979436 8.30769231,5.53640545 L8.30769231,9.69436378 C8.30769231,10.0755792 8.61498332,10.3846154 9,10.3846154 Z M9,13.1538462 C9.38235102,13.1538462 9.69230769,12.8438895 9.69230769,12.4615385 C9.69230769,12.0791874 9.38235102,11.7692308 9,11.7692308 C8.61764898,11.7692308 8.30769231,12.0791874 8.30769231,12.4615385 C8.30769231,12.8438895 8.61764898,13.1538462 9,13.1538462 Z"
                id="Triangle-29"
              >
              </path>
            </g>
          </g>
        </svg>
        <p
          style={{
            fontSize: '80%',
            color: 'red',
            fontWeight: 'bold',
            textAlign: 'center',
            margin: 'auto',
            width: '90%',
          }}
        >
          {' ' + t('confluxAddressWarningModal')}
        </p>

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
