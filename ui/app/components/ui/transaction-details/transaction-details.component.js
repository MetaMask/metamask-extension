import React from 'react'
import PropTypes from 'prop-types'

const TransactionDetails = ({
  amount,
  fee,
  ethCost,
}) => (
  <div className="popover__details">
    <div className="popover__details--amounts">
      <div className="popover__details__col">
        Amount<br />
        Transaction Fee
      </div>
      <div className="popover__details__col">
        {amount}<br />
        {fee}
      </div>
    </div>
    <hr className="popover__details__rule" />
    <div className="popover__details--totals">
      <div className="popover__details__col">
        <h3>Total amount</h3>
      </div>
      <div className="popover__details__col">
        <h3 className="popover__details__heading">{amount + fee}</h3>
        <p>{ethCost} ETH</p>
      </div>
    </div>
  </div>
)

TransactionDetails.propTypes = {
  amount: PropTypes.number.isRequired,
  fee: PropTypes.number.isRequired,
  ethCost: PropTypes.number.isRequired,
}

export default TransactionDetails
