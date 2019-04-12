import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Modal, { ModalContent } from '../../modal'

export default class ClearPermissionsHistory extends PureComponent {
  static propTypes = {
    hideModal: PropTypes.func.isRequired,
    clearPermissionsHistory: PropTypes.func.isRequired,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  handleClear = () => {
    const { clearPermissionsHistory, hideModal } = this.props
    clearPermissionsHistory()
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
          title={t('clearPermissionsHistory')}
          description={t('confirmClear')}
        />
      </Modal>
    )
  }
}
