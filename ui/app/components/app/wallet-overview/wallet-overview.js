import React from 'react'
import PropTypes from 'prop-types'

const WalletOverview = ({ balance, buttons, icon }) => {
  return (
    <div className="wallet-overview">
      <div className="wallet-overview__balance">
        { icon }
        { balance }
      </div>
      <div className="wallet-overview__buttons">
        { buttons }
      </div>
    </div>
  )
}

WalletOverview.propTypes = {
  balance: PropTypes.element.isRequired,
  buttons: PropTypes.element.isRequired,
  icon: PropTypes.element.isRequired,
}

export default WalletOverview
