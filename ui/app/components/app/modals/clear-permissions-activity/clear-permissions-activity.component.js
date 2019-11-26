import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Modal, { ModalContent } from '../../modal'

export default class ClearPermissionsActivity extends PureComponent {
  static propTypes = {
    hideModal: PropTypes.func.isRequired,
    clearPermissionsLog: PropTypes.func.isRequired,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  handleClear = () => {
    const { clearPermissionsLog, hideModal } = this.props
    clearPermissionsLog()
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
          title={t('clearPermissionsActivity')}
          description={t('confirmClearPermissionsActivity')}
        />
      </Modal>
    )
  }
}
