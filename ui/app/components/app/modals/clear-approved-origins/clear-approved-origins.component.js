import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Modal, { ModalContent } from '../../modal'

export default class ClearApprovedOrigins extends PureComponent {
  static propTypes = {
    hideModal: PropTypes.func.isRequired,
    clearApprovedOrigins: PropTypes.func.isRequired,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  handleClear = () => {
    const { clearApprovedOrigins, hideModal } = this.props
    clearApprovedOrigins()
    hideModal()
  }

  render () {
    const { t } = this.context

    return (
      <Modal
        onSubmit={this.handleClear}
        onCancel={() => this.props.hideModal()}
        submitText={t('ok')}
        cancelText={t('nevermind')}
        submitType="secondary"
      >
        <ModalContent
          title={t('clearApprovalData')}
          description={t('confirmClear')}
        />
      </Modal>
    )
  }
}
