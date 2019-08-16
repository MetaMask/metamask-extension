import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Modal, { ModalContent } from '../../modal'

export default class ThreeBoxRestoreConfirm extends PureComponent {
  static propTypes = {
    hideModal: PropTypes.func.isRequired,
    restoreFromThreeBox: PropTypes.func.isRequired,
    turnThreeBoxSyncingOn: PropTypes.func.isRequired,
    setRestoredFromThreeBox: PropTypes.func.isRequired,
    address: PropTypes.string.isRequired,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  handleCancel = () => {
    const { setRestoredFromThreeBox, hideModal } = this.props
    setRestoredFromThreeBox(false)
    hideModal()
  }

  handleConfirm = () => {
    const {
      restoreFromThreeBox,
      turnThreeBoxSyncingOn,
      hideModal,
      address,
    } = this.props
    restoreFromThreeBox(address)
      .then(() => {
        turnThreeBoxSyncingOn()
        hideModal()
      })
  }

  render () {
    const { t } = this.context

    return (
      <Modal
        onSubmit={this.handleConfirm}
        onCancel={this.handleCancel}
        submitText={t('restore')}
        cancelText={t('noThanks')}
        submitType="secondary"
      >
        <ModalContent
          title={`${t('dataBackupFound')}`}
          description={t('restoreWalletPreferences')}
        />
      </Modal>
    )
  }
}
