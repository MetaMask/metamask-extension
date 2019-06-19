import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ethUtil from 'ethereumjs-util'
import Modal from '../../modal'

export default class ThreeBoxApprovalModal extends Component {
  static propTypes = {
    hideModal: PropTypes.func.isRequired,
    signPersonalMessage: PropTypes.func.isRequired,
    cancelPersonalMessage: PropTypes.func.isRequired,
    txData: PropTypes.object.isRequired,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  handleApprove = () => {
    const { signPersonalMessage, txData, hideModal } = this.props
    signPersonalMessage(txData)
    hideModal()
  }

  handleCancel = (event) => {
    const { cancelPersonalMessage, hideModal } = this.props
    cancelPersonalMessage(event)
    hideModal()
  }

  msgHexToText (hex) {
    try {
      const stripped = ethUtil.stripHexPrefix(hex)
      const buff = Buffer.from(stripped, 'hex')
      return buff.length === 32 ? hex : buff.toString('utf8')
    } catch (e) {
      return hex
    }
  }

  render () {
    const { t } = this.context
    const { txData } = this.props
    const { msgParams: { data } } = txData

    return (
      <Modal
        headerText={`Back up your data with 3box?`}
        onClose={this.handleCancel}
        onSubmit={this.handleApprove}
        onCancel={this.handleCancel}
        submitText={'Yes please!'}
        cancelText={'No thanks.'}
        submitType="secondary"
      >
        <div>
          <div className="confirm-remove-account__description">
            { this.msgHexToText(data) }
            <a
              className="confirm-remove-account__link"
              rel="noopener noreferrer"
              target="_blank" href="https://metamask.zendesk.com/hc/en-us/articles/360015289932">
              { t('learnMore') }
            </a>
          </div>
        </div>
      </Modal>
    )
  }
}
