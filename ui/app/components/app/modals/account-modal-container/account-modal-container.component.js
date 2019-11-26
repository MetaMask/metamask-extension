import PropTypes from 'prop-types'
import React from 'react'
import Identicon from '../../../ui/identicon'

export default function AccountModalContainer (props, context) {
  const {
    selectedIdentity,
    showBackButton,
    backButtonAction,
    hideModal,
    children,
  } = props

  return (
    <div style={{ borderRadius: '4px' }}>
      <div className="account-modal-container">
        <div>
          <Identicon
            address={selectedIdentity.address}
            diameter={64}
          />
        </div>
        {showBackButton && (
          <div className="account-modal-back" onClick={backButtonAction}>
            <i className="fa fa-angle-left fa-lg" />
            <span className="account-modal-back__text">{' ' + context.t('back')}</span>
          </div>
        )}
        <div className="account-modal-close" onClick={hideModal} />
        {children}
      </div>
    </div>
  )
}

AccountModalContainer.contextTypes = {
  t: PropTypes.func,
}

AccountModalContainer.defaultProps = {
  showBackButton: false,
  children: null,
  backButtonAction: undefined,
}

AccountModalContainer.propTypes = {
  selectedIdentity: PropTypes.object.isRequired,
  showBackButton: PropTypes.bool,
  backButtonAction: PropTypes.func,
  hideModal: PropTypes.func.isRequired,
  children: PropTypes.node,
}
