import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Modal, { ModalContent } from '../../modal'

export default class ClearPlugins extends PureComponent {
  static propTypes = {
    hideModal: PropTypes.func.isRequired,
    clearPlugins: PropTypes.func.isRequired,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  handleClear = () => {
    const { clearPlugins, hideModal } = this.props
    clearPlugins()
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
          title={t('clearPlugins')}
          description={t('confirmClearPlugins')}
        />
      </Modal>
    )
  }
}
