import React from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';

import Box from '../../../ui/box';
import Identicon from '../../../ui/identicon';
import DetectedTokenValues from '../detected-token-values/detected-token-values';
import DetectedTokenAddress from '../detected-token-address/detected-token-address';
import DetectedTokenAggregators from '../detected-token-aggregators/detected-token-aggregators';
import { DISPLAY } from '../../../../helpers/constants/design-system';
import { getTokenList } from '../../../../selectors';

const DetectedTokenDetails = ({ tokenAddress }) => {
  const tokenList = useSelector(getTokenList);
  const token = tokenList[tokenAddress];

  return (
    <Box display={DISPLAY.FLEX} className="detected-token-details">
      <Identicon
        className="detected-token-details__identicon"
        address={tokenAddress}
        diameter={40}
      />
      <Box
        display={DISPLAY.GRID}
        marginLeft={2}
        className="detected-token-details__data"
      >
        <DetectedTokenValues token={token} />
        <DetectedTokenAddress address={token.address} />
        <DetectedTokenAggregators aggregatorsList={token.aggregators} />
      </Box>
    </Box>
  );
};

DetectedTokenDetails.propTypes = {
  tokenAddress: PropTypes.string,
};

export default DetectedTokenDetails;
