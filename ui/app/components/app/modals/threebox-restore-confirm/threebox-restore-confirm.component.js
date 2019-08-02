import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Modal, { ModalContent } from '../../modal'

export default class ThreeBoxRestoreConfirm extends PureComponent {
  static propTypes = {
    hideModal: PropTypes.func.isRequired,
    restoreFromThreeBox: PropTypes.func.isRequired,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  handleConfirm = () => {
    this.props.restoreFromThreeBox(this.props.address)
      .then(() => this.props.hideModal())
  }

  render () {
    const { t } = this.context

    return (
      <Modal
        onSubmit={this.handleConfirm}
        onCancel={() => this.props.hideModal()}
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
