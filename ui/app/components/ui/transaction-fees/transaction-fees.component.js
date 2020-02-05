import React from 'react'

const TransactionFees = () => (
  <div className="fees">
    <div className="fees__option fast fees__option--selected">
      <h3 className="fees__heading">Fast</h3>
      <h4 className="fees__subheading">2m 30s</h4>
      <p className="fees__wrap">
        $0.20
        <span className="fees__eth">0.00354 ETH</span>
      </p>
    </div>
    <div className="fees__option faster">
      <h3 className="fees__heading">Faster</h3>
      <h4 className="fees__subheading">1m 30s</h4>
      <p className="fees__wrap">
        $0.30
        <span className="fees__eth">0.00456 ETH</span>
      </p>
    </div>
    <div className="fees__option fastest">
      <h3 className="fees__heading">Fastest</h3>
      <h4 className="fees__subheading">30s</h4>
      <p className="fees__wrap">
        $0.50
        <span className="fees__eth">0.00567 ETH</span>
      </p>
    </div>
  </div>
)

export default TransactionFees
