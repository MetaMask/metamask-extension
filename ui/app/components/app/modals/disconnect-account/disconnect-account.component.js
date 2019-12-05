import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Modal from '../../modal'
import Button from '../../../ui/button'


export default class DisconnectAccount extends PureComponent {
  static propTypes = {
    hideModal: PropTypes.func.isRequired,
    disconnectAccount: PropTypes.func.isRequired,
    accountLabel: PropTypes.string.isRequired,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  render () {
    const { t } = this.context
    const { hideModal, disconnectAccount, accountLabel } = this.props

    return (
      <Modal
        headerText={t('disconnectAccountQuestion')}
        onClose={() => hideModal()}
        hideFooter
      >
        <div className="disconnect-account-modal">
          <div className="disconnect-account-modal__description">
            { t('disconnectAccountModalDescription', [ accountLabel ]) }
          </div>
          <Button
            type="primary"
            onClick={ () => {
              disconnectAccount()
              hideModal()
            }}
          >
            { t('disconnectFromThisAccount') }
          </Button>
          <Button
            type="secondary"
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
