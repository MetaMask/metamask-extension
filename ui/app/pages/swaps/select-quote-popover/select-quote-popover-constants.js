import PropTypes from 'prop-types'

export const QUOTE_DATA_ROWS_PROPTYPES_SHAPE = PropTypes.shape({
  aggId: PropTypes.string.isRequired,
  amountReceiving: PropTypes.string.isRequired,
  destinationTokenDecimals: PropTypes.number.isRequired,
  destinationTokenSymbol: PropTypes.string.isRequired,
  destinationTokenValue: PropTypes.string.isRequired,
  isBestQuote: PropTypes.bool,
  liquiditySource: PropTypes.string.isRequired,
  metaMaskFee: PropTypes.string.isRequired,
  networkFees: PropTypes.string.isRequired,
  quoteSource: PropTypes.string.isRequired,
  rawNetworkFees: PropTypes.number.isRequired,
  slippage: PropTypes.string.isRequired,
  sourceTokenDecimals: PropTypes.number.isRequired,
  sourceTokenSymbol: PropTypes.string.isRequired,
  sourceTokenValue: PropTypes.string.isRequired,
})
