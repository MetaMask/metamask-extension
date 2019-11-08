import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Modal, { ModalContent } from '../../modal'
import Button from '../../../ui/button'


export default class DisconnectAccount extends PureComponent {
  static propTypes = {
    hideModal: PropTypes.func.isRequired,
    disconnectAccount: PropTypes.func.isRequired,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  render () {
    const { t } = this.context
    const { hideModal, disconnectAllAccounts, disconnectAccount } = this.props

    return (
      <Modal
        headerText={t('disconnectAccountQuestion')}
        onClose={() => hideModal()}
        hideFooter={true}
      >
        <div className="disconnect-account-modal">
          <div className="disconnect-account-modal__description">
            { t('disconnectAccountModalDescription') }
          </div>
          <Button
            type={'primary'}
            onClick={ () => {
              disconnectAccount()
              hideModal()
            }}
            className=""
          >
            { t('disconnectFromThisAccount') }
          </Button>
          <Button
            type={'secondary'}
            onClick={ () => hideModal() }
            className="disconnect-account-modal__cancel-button"
          >
            { t('cancel') }
          </Button>
        </div>
      </Modal>
    )
  }
}
