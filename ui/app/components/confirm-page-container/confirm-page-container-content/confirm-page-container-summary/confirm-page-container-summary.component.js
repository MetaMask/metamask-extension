import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import Identicon from '../../../identicon'

const ConfirmPageContainerSummary = props => {
  const { action, title, subtitle, hideSubtitle, className, identiconAddress, nonce } = props

  return (
    <div className={classnames('confirm-page-container-summary', className)}>
      <div className="confirm-page-container-summary__action-row">
        <div className="confirm-page-container-summary__action">
          { action }
        </div>
        {
          nonce && (
            <div className="confirm-page-container-summary__nonce">
              { `#${nonce}` }
            </div>
          )
        }
      </div>
      <div className="confirm-page-container-summary__title">
        {
          identiconAddress && (
            <Identicon
              className="confirm-page-container-summary__identicon"
              diameter={36}
              address={identiconAddress}
            />
          )
        }
        <div className="confirm-page-container-summary__title-text">
          { title }
        </div>
      </div>
      {
        hideSubtitle || <div className="confirm-page-container-summary__subtitle">
          { subtitle }
        </div>
      }
    </div>
  )
}

ConfirmPageContainerSummary.propTypes = {
  action: PropTypes.string,
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  subtitle: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  hideSubtitle: PropTypes.bool,
  className: PropTypes.string,
  identiconAddress: PropTypes.string,
  nonce: PropTypes.string,
}

export default ConfirmPageContainerSummary
