import React from 'react'

const TransactionFees = () => (
  <div className="fees">
    <div className="fees__option fast fees__option--selected">
      <h3>Fast</h3>
      <h4>2m 30s</h4>
      <p>
        $0.20
        <span className="eth">0.00354 ETH</span>
      </p>
    </div>
    <div className="fees__option faster">
      <h3>Faster</h3>
      <h4>1m 30s</h4>
      <p>
        $0.30
        <span className="eth">0.00456 ETH</span>
      </p>
    </div>
    <div className="fees__option fastest">
      <h3>Fastest</h3>
      <h4>30s</h4>
      <p>
        $0.50
        <span className="eth">0.00567 ETH</span>
      </p>
    </div>
  </div>
)

export default TransactionFees
