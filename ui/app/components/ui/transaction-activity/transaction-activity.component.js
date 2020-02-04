import React from 'react'
import PropTypes from 'prop-types'

const TransactionActivity = ({ activities }) => (
  <div className="transaction-activity">
    <div className="transaction-activity__header">
      <a className="transaction-activity__etherscan" href="#" onClick={e => e.preventDefault()}>
        View on Etherscan
      </a>
      <h3 className="transaction-activity__heading">Activity</h3>
    </div>
    <ul className="transaction-activity__list">
      {
        activities.map((item, index) => (
          <li className="transaction-activity__list-item" key={index}>
            <div className="transaction-activity__line" />
            <div className="transaction-activity__bullet">
              <svg width="7" height="7" viewBox="0 0 7 7" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="3.5" cy="3.5" r="3.5" fill="#037DD6" />
              </svg>
            </div>
            <span>{item}</span>
          </li>
        ))
      }
    </ul>
  </div>
)

TransactionActivity.propTypes = {
  activities: PropTypes.array
}

export default TransactionActivity
