import PropTypes from 'prop-types';

export const QUOTE_DATA_ROWS_PROPTYPES_SHAPE = PropTypes.shape({
  aggId: PropTypes.string.isRequired,
  amountReceiving: PropTypes.string.isRequired,
  destinationTokenDecimals: PropTypes.number.isRequired,
  destinationTokenSymbol: PropTypes.string.isRequired,
  destinationTokenValue: PropTypes.string.isRequired,
  isBestQuote: PropTypes.bool,
  networkFees: PropTypes.string.isRequired,
  quoteSource: PropTypes.string.isRequired,
  rawNetworkFees: PropTypes.string.isRequired,
  slippage: PropTypes.number.isRequired,
  sourceTokenDecimals: PropTypes.number.isRequired,
  sourceTokenSymbol: PropTypes.string.isRequired,
  sourceTokenValue: PropTypes.string.isRequired,
});
