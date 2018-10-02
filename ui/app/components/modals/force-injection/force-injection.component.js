import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Modal, { ModalContent } from '../../modal'

export default class ForceInjection extends PureComponent {
  static propTypes = {
    hideModal: PropTypes.func.isRequired,
    forceInjection: PropTypes.func.isRequired,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  handleForce = () => {
    const { forceInjection, hideModal } = this.props
    forceInjection()
    hideModal()
  }

  render () {
    const { t } = this.context

    return (
      <Modal
        onSubmit={this.handleForce}
        onCancel={() => this.props.hideModal()}
        submitText={t('ok')}
        cancelText={t('nevermind')}
        submitType="secondary"
      >
        <ModalContent
          title={t('exposeAccounts')}
          description={t('confirmExpose')}
        />
      </Modal>
    )
  }
}
