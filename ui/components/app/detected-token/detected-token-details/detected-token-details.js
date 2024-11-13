import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { CHAIN_IDS } from '@metamask/transaction-controller';
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
  getIsTokenDetectionInactiveOnMainnet,
  getTestNetworkBackgroundColor,
  getTokenList,
  selectERC20TokensByChain,
} from '../../../../selectors';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../../../shared/constants/network';
import { STATIC_MAINNET_TOKEN_LIST } from '../../../../../shared/constants/tokens';

const DetectedTokenDetails = ({
  token,
  handleTokenSelection,
  tokensListDetected,
  chainId,
}) => {
  const tokenListCurrentChain = useSelector(getTokenList);
  const tokenListByChainId = useSelector(selectERC20TokensByChain);
  const tokenList = tokenListByChainId?.[chainId]?.data ?? {};
  const isTokenDetectionInactiveOnMainnet = useSelector(
    getIsTokenDetectionInactiveOnMainnet,
  );

  let tokenData = {};
  if (process.env.PORTFOLIO_VIEW) {
    tokenData =
      chainId === CHAIN_IDS.MAINNET && isTokenDetectionInactiveOnMainnet
        ? STATIC_MAINNET_TOKEN_LIST
        : tokenList[token.address?.toLowerCase()] ?? {};
  } else {
    tokenData = tokenListCurrentChain[token.address?.toLowerCase()];
  }

  const testNetworkBackgroundColor = useSelector(getTestNetworkBackgroundColor);

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
            src={CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[chainId]}
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
        {/* {process.env.PORTFOLIO_VIEW ? (
          <DetectedTokenAddress tokenAddress={token.address} />
          {tokenData?.aggregators.length > 0 && (
            <DetectedTokenAggregators aggregators={tokenData?.aggregators} />
          )}
        ) : null} */}

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
  chainId: PropTypes.string,
};

export default DetectedTokenDetails;
