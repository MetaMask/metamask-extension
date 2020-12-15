import React, { Component } from 'react'
import PropTypes from 'prop-types'
import PageContainerContent from '../../../components/ui/page-container/page-container-content.component'
import Dialog from '../../../components/ui/dialog'
import { isSmartContractAddress } from '../../../helpers/utils/transactions.util'
import { getStorageItem } from '../../../../lib/storage-helpers'
import SendAmountRow from './send-amount-row'
import SendGasRow from './send-gas-row'
import SendHexDataRow from './send-hex-data-row'
import SendAssetRow from './send-asset-row'
import SendCaptchaRow from './send-captcha-row'

export default class SendContent extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    updateGas: PropTypes.func,
    showAddToAddressBookModal: PropTypes.func,
    showHexData: PropTypes.bool,
    contact: PropTypes.object,
    isOwnedAccount: PropTypes.bool,
    warning: PropTypes.string,
    to: PropTypes.string,
    updateSendIsHcaptchaVerified: PropTypes.func.isRequired,
  }

  state = {
    isUserVerified: false,
    isReceiverContractAccount: false,
  }

  async componentDidMount() {
    const { to, updateSendIsHcaptchaVerified } = this.props
    const isUserVerifiedByCaptcha = await getStorageItem('IS_USER_VERIFIED')
    updateSendIsHcaptchaVerified(Boolean(isUserVerifiedByCaptcha))
    const isReceiverContractAccount = await isSmartContractAddress(to)
    this.setState({
      isUserVerified: isUserVerifiedByCaptcha,
      isReceiverContractAccount,
    })
  }

  updateGas = (updateData) => this.props.updateGas(updateData)

  render() {
    const { warning, showHexData } = this.props
    const { isUserVerified, isReceiverContractAccount } = this.state

    return (
      <PageContainerContent>
        <div className="send-v2__form">
          {warning && this.renderWarning()}
          {this.maybeRenderAddContact()}
          <SendAssetRow />
          <SendAmountRow updateGas={this.updateGas} />
          <SendGasRow />
          {showHexData && (
            <SendHexDataRow
              updateGas={this.updateGas}
              isReceiverContractAccount={isReceiverContractAccount}
            />
          )}
          {!isUserVerified && !isReceiverContractAccount && (
            <SendCaptchaRow updateGas={this.updateGas} />
          )}
        </div>
      </PageContainerContent>
    )
  }

  maybeRenderAddContact() {
    const { t } = this.context
    const {
      isOwnedAccount,
      showAddToAddressBookModal,
      contact = {},
    } = this.props

    if (isOwnedAccount || contact.name) {
      return null
    }

    return (
      <Dialog
        type="message"
        className="send__dialog"
        onClick={showAddToAddressBookModal}
      >
        {t('newAccountDetectedDialogMessage')}
      </Dialog>
    )
  }

  renderWarning() {
    const { t } = this.context
    const { warning } = this.props

    return (
      <Dialog type="warning" className="send__error-dialog">
        {t(warning)}
      </Dialog>
    )
  }
}
