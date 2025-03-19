import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  AvatarToken,
  AvatarTokenSize,
  BadgeWrapper,
  Box,
} from '../../../component-library';
import DetectedTokenValues from '../detected-token-values/detected-token-values';
import DetectedTokenAddress from '../detected-token-address/detected-token-address';
import DetectedTokenAggregators from '../detected-token-aggregators/detected-token-aggregators';
import { Display } from '../../../../helpers/constants/design-system';
import {
  getCurrentNetwork,
  getTestNetworkBackgroundColor,
  getTokenList,
} from '../../../../selectors';

const DetectedTokenDetails = ({
  token,
  handleTokenSelection,
  tokensListDetected,
}) => {
  const tokenList = useSelector(getTokenList);
  const tokenData = tokenList[token.address?.toLowerCase()];
  const testNetworkBackgroundColor = useSelector(getTestNetworkBackgroundColor);
  const currentNetwork = useSelector(getCurrentNetwork);

  return (
    <Box
      display={Display.Flex}
      className="detected-token-details"
      marginBottom={4}
    >
      <BadgeWrapper
        badge={
          <AvatarNetwork
            size={AvatarNetworkSize.Xs}
            name={currentNetwork?.nickname || ''}
            src={currentNetwork?.rpcPrefs?.imageUrl}
            backgroundColor={testNetworkBackgroundColor}
          />
        }
        marginRight={2}
        className="detected-token-details__identicon"
      >
        <AvatarToken
          name={token.symbol}
          src={token.image}
          size={AvatarTokenSize.Md}
        />
      </BadgeWrapper>

      <Box
        display={Display.Grid}
        marginLeft={2}
        className="detected-token-details__data"
      >
        <DetectedTokenValues
          token={token}
          handleTokenSelection={handleTokenSelection}
          tokensListDetected={tokensListDetected}
        />
        <DetectedTokenAddress tokenAddress={token.address} />
        {tokenData?.aggregators.length > 0 && (
          <DetectedTokenAggregators aggregators={tokenData?.aggregators} />
        )}
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
    image: PropTypes.string,
  }),
  handleTokenSelection: PropTypes.func.isRequired,
  tokensListDetected: PropTypes.object,
};

export default DetectedTokenDetails;
