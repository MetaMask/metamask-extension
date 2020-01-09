import React from 'react'
import PropTypes from 'prop-types'

const TransactionDetails = ({
  amount,
  fee,
  ethCost,
}) => (
  <div className="details">
    <div className="details-amounts">
      <div className="col">
        Amount<br />
        Transaction Fee
      </div>
      <div className="col">
        ${amount}<br />
        ${fee}
      </div>
    </div>
    <hr />
    <div className="details-totals">
      <div className="col">
        <h3>Total amount</h3>
      </div>
      <div className="col">
        <h3>${amount + fee}</h3>
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
