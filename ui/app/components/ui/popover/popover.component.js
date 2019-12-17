import React from 'react'
// import PropTypes from 'prop-types'

const close = e => {
  e.preventDefault()
  console.log(e)
}

const activities = [
  "Transaction created with a value of 0.000023 ETH at 09:50 on 8/8/2019.",
  "Transaction submitted with gas fee of 0 WEI at 09:47 on 8/8/2019.",
  "Transaction confirmed at 09:45 on 8/8/2019.",
  "Transaction created with a value of 0.000023 ETH at 09:50 on 8/8/2019.",
  "Transaction submitted with gas fee of 0 WEI at 09:47 on 8/8/2019.",
  "Transaction confirmed at 09:45 on 8/8/2019.",
]

const Activity = () => (
  <div className="activity">
    <div className="header">
      <a href="#" onClick={e => e.preventDefault()}className="etherscan">
        View on Etherscan
      </a>
      <h3>Activity</h3>
    </div>
    <ul>
      <div className="line" />
      {
        activities.map(item => (
          <li><span>{item}</span></li>
        ))
      }
    </ul>
  </div>
)

const Details = () => (
  <div className="details">
    <div className="details-amounts">
      <div className="col">
        Amount<br />
        Transaction Fee
      </div>
      <div className="col">
        $0.00<br />
        $0.04
      </div>
    </div>
    <hr />
    <div className="details-totals">
      <div className="col">
        <h3>Total amount</h3>
      </div>
      <div className="col">
        <h3>$0.04</h3>
        <p>0.000185 ETH</p>
      </div>
    </div>
  </div>
)

const PopOver = () => (
  <div>
    <div className="popover-content">
      <div className="header">
        <h2>Approve spend limit</h2>
        <a href="#" className="close" onClick={close}>
          <div>
            <div className="line a"></div>
            <div className="line b"></div>
          </div>
        </a>
      </div>
      <div className="container">
        <div className="popover-item">
          <div className="col">
            <h3>STATUS</h3>
            <h4>Confirmed</h4>
          </div>
          <div className="col">
            <h3>DATE</h3>
            <h4>Sept 20 at 9:08am</h4>
          </div>
        </div>
        <div className="popover-item">
          <div className="col">
            <h3>from</h3>
            <h4>834759....872345</h4>
          </div>
          <div className="col">
            <h3>to</h3>
            <h4>834759....872345</h4>
          </div>
        </div>
        <div className="popover-item">
          <div className="col">
            <h3>nonce</h3>
            <h4>#5</h4>
          </div>
          <div className="col">
            <h3>description</h3>
            <h4>0x may spend up to:<br /> 071,992.54744099 DAI</h4>
          </div>
        </div>
        <Details />
        <Activity />
      </div>
    </div>
    <a href="#" className="popover-bg" onClick={close} />
  </div>
)

export default PopOver
