import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Modal, { ModalContent } from '../../modal'

export default class ClearPermissions extends PureComponent {
  static propTypes = {
    hideModal: PropTypes.func.isRequired,
    clearPermissions: PropTypes.func.isRequired,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  handleClear = () => {
    const { clearPermissions, hideModal } = this.props
    clearPermissions()
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
