import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Modal, { ModalContent } from '../../modal'

export default class ThreeBoxRestoreConfirm extends PureComponent {
  static propTypes = {
    hideModal: PropTypes.func.isRequired,
    restoreFromThreeBox: PropTypes.func.isRequired,
    setThreeBoxSyncingPermission: PropTypes.func.isRequired,
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
      setRestoredFromThreeBox,
      setThreeBoxSyncingPermission,
      hideModal,
      address,
    } = this.props
    restoreFromThreeBox(address)
      .then(() => {
        setRestoredFromThreeBox(true)
        setThreeBoxSyncingPermission(true)
        hideModal()
      })
  }

  render () {
    const { t } = this.context

    return (
      <Modal
        headerText={t('dataBackupFound')}
        onSubmit={this.handleConfirm}
        onCancel={this.handleCancel}
        submitText={t('confirm')}
        cancelText={t('noThanks')}
        submitType="secondary"
      >
        <ModalContent
          description={t('restoreWalletPreferences')}
        />
      </Modal>
    )
  }
}
