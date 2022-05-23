import React from 'react';
import PropTypes from 'prop-types';

import Box from '../../../ui/box';
import Identicon from '../../../ui/identicon';
import DetectedTokenValues from '../detected-token-values/detected-token-values';
import DetectedTokenAddress from '../detected-token-address/detected-token-address';
import DetectedTokenAggregators from '../detected-token-aggregators/detected-token-aggregators';
import { DISPLAY } from '../../../../helpers/constants/design-system';

const DetectedTokenDetails = ({
  token,
  handleTokenSelection,
  tokensListDetected,
}) => {
  return (
    <Box
      display={DISPLAY.FLEX}
      className="detected-token-details"
      marginBottom={4}
    >
      <Identicon
        className="detected-token-details__identicon"
        address={token.address}
        diameter={40}
      />
      <Box
        display={DISPLAY.GRID}
        marginLeft={2}
        className="detected-token-details__data"
      >
        <DetectedTokenValues
          token={token}
          handleTokenSelection={handleTokenSelection}
          tokensListDetected={tokensListDetected}
        />
        <DetectedTokenAddress tokenAddress={token.address} />
        <DetectedTokenAggregators aggregators={token.aggregators} />
      </Box>
    </Box>
  );
};

DetectedTokenDetails.propTypes = {
  token: PropTypes.shape({
    address: PropTypes.string.isRequired,
    decimals: PropTypes.number,
    symbol: PropTypes.string,
    iconUrl: PropTypes.string,
    aggregators: PropTypes.array,
  }),
  handleTokenSelection: PropTypes.func.isRequired,
  tokensListDetected: PropTypes.object,
};

export default DetectedTokenDetails;
