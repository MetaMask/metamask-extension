import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Modal, { ModalContent } from '../../modal'

export default class ConfirmResetAccount extends PureComponent {
  static propTypes = {
    hideModal: PropTypes.func.isRequired,
    resetAccount: PropTypes.func.isRequired,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  handleReset = () => {
    this.props.resetAccount().then(() => this.props.hideModal())
  }

  render() {
    const { t } = this.context

    return (
      <Modal
        onSubmit={this.handleReset}
        onCancel={() => this.props.hideModal()}
        submitText={t('reset')}
        cancelText={t('nevermind')}
        submitType="danger"
      >
        <ModalContent
          title={`${t('resetAccount')}?`}
          description={t('resetAccountDescription')}
        />
      </Modal>
    )
  }
}
