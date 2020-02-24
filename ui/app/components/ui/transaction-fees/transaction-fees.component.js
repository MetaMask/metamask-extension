import React from 'react'

const onClick = event => {
  event.preventDefault()
  event.stopPropagation()
}

const FeesLink = (props) => <a href='#' onClick={onClick} className="fees__option">
  {props.children}
</a>

const TransactionFees = () => (
  <div className="fees">
    <FeesLink>
      <h3 className="fees__heading">Fast</h3>
      <h4 className="fees__subheading">2m 30s</h4>
      <p className="fees__wrap">
        $0.20
        <span className="fees__eth">0.00354 ETH</span>
      </p>
    </FeesLink>
    <FeesLink>
      <h3 className="fees__heading">Faster</h3>
      <h4 className="fees__subheading">1m 30s</h4>
      <p className="fees__wrap">
        $0.30
        <span className="fees__eth">0.00456 ETH</span>
      </p>
    </FeesLink>
    <FeesLink>
      <h3 className="fees__heading">Fastest</h3>
      <h4 className="fees__subheading">30s</h4>
      <p className="fees__wrap">
        $0.50
        <span className="fees__eth">0.00567 ETH</span>
      </p>
    </FeesLink>
  </div>
)

export default TransactionFees
