import React from 'react'
import PropTypes from 'prop-types'

const AggregatorLogoMap = {
  'totle': <div className="loading-swaps-quotes__totle"><img src="/images/totle-agg-logo.svg" /></div>,
  'dexag': <div className="loading-swaps-quotes__dexag"><img src="/images/dexag-agg-logo.svg" /></div>,
  'uniswap': <div className="loading-swaps-quotes__uniswap"><img src="/images/uniswap-agg-logo.svg" /></div>,
  'paraswap': <div className="loading-swaps-quotes__paraswap"><img src="/images/paraswap-agg-logo.svg" /></div>,
  '0x': <div className="loading-swaps-quotes__0x"><img src="/images/0x-agg-logo.svg" /></div>,
  '1inch': <div className="loading-swaps-quotes__1inch"><img src="/images/1inch-agg-logo.svg" /></div>,
}

export default function AggregatorLogo ({ aggregatorName }) {
  return (<div className="loading-swaps-quotes__logo">{ AggregatorLogoMap[aggregatorName] }</div>)
}

AggregatorLogo.propTypes = {
  aggregatorName: PropTypes.string.isRequired,
}
