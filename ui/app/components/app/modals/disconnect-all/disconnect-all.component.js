import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Modal from '../../modal'
import Button from '../../../ui/button'


export default class DisconnectAll extends PureComponent {
  static propTypes = {
    hideModal: PropTypes.func.isRequired,
    disconnectAll: PropTypes.func.isRequired,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  render () {
    const { t } = this.context
    const { hideModal, disconnectAll } = this.props

    return (
      <Modal
        headerText={t('disconnectAllAccountsQuestion')}
        onClose={() => hideModal()}
        hideFooter={true}
      >
        <div className="disconnect-all-modal">
          <div className="disconnect-all-modal__description">
            { t('disconnectAllModalDescription') }
          </div>
          <Button
            type={'danger'}
            onClick={ () => {
              disconnectAll()
              hideModal()
            }}
            className=""
          >
            { t('disconnectAll') }
          </Button>
          <Button
            type={'secondary'}
            onClick={ () => hideModal() }
            className="disconnect-all-modal__cancel-button"
          >
            { t('cancel') }
          </Button>
        </div>
      </Modal>
    )
  }
}
