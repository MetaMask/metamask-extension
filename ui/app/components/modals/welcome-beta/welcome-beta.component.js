import React from 'react'
import PropTypes from 'prop-types'
import Modal, { ModalContent } from '../../modal'

const TransactionConfirmed = (props, context) => {
  const { t } = context
  const { hideModal } = props

  return (
    <Modal
      onSubmit={() => hideModal()}
      submitText={t('ok')}
    >
      <ModalContent
        title={t('uiWelcome')}
        description={t('uiWelcomeMessage')}
      />
    </Modal>
  )
}

TransactionConfirmed.contextTypes = {
  t: PropTypes.func,
}

TransactionConfirmed.propTypes = {
  hideModal: PropTypes.func,
}

export default TransactionConfirmed
