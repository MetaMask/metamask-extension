import { BigNumber } from 'bignumber.js';
import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { Box, Button, Text } from '../../../components/component-library';

import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderRadius,
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { MarketMyriad } from '../types';
import PredictNavigation from '../predict.navigation';
import { STAGING_API_ENDPOINT } from '../utils';

const PredictMarketsContainer = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [marketData, setMarketData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const history = useHistory();

  const calculateVolume = (value: string | number | undefined) =>
    value
      ? new BigNumber(typeof value === 'string' ? value : value.toString())
          .toNumber()
          .toFixed(2)
      : '0.00';

  const getMarkets = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${STAGING_API_ENDPOINT}/markets\?token\=USDC`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
      const marketsData = await response.json();
      console.log('marketsData', marketsData);
      setMarketData(marketsData);
    } catch (error) {
      console.error('Error fetching trades:', error);
      setMarketData([]);
    } finally {
      setLoading(false);
    }
  };

  const getDaysLeft = (endDateString: string) => {
    if (!endDateString) {
      return '';
    }
    const endDate = new Date(endDateString);
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return `${days}D left`;
  };

  useEffect(() => {
    getMarkets();
  }, []);

  return (
    <>
      <PredictNavigation />
      <Box>
        {loading && (
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            justifyContent={JustifyContent.center}
            alignItems={AlignItems.center}
            padding={8}
          >
            <Text
              variant={TextVariant.bodyMd}
              color={TextColor.textAlternative}
            >
              Loading positions...
            </Text>
          </Box>
        )}
        {marketData &&
          marketData.length > 0 &&
          marketData.map((market: MarketMyriad) => {
            return (
              <Box
                key={market.id}
                backgroundColor={BackgroundColor.backgroundDefault}
                borderRadius={BorderRadius.LG}
                padding={4}
                marginBottom={4}
              >
                <Box
                  display={Display.Flex}
                  flexDirection={FlexDirection.Row}
                  alignItems={AlignItems.center}
                  gap={3}
                >
                  <img
                    src={market.image_url?.replace(/\s+/g, '') || './images/logo/metamask-fox.svg'}
                    alt={market.title}
                    style={{ width: 48, height: 48, borderRadius: 8 }}
                  />
                  <Box>
                    <Text variant={TextVariant.headingSm}>
                      {market.title}
                    </Text>
                  </Box>
                </Box>
                <Box
                  display={Display.Flex}
                  flexDirection={FlexDirection.Row}
                  alignItems={AlignItems.center}
                  gap={3}
                  marginTop={2}
                >
                  <Box>
                    <Text variant={TextVariant.bodySm}>
                      {getDaysLeft(market.expires_at)}
                    </Text>
                  </Box>
                  <Box>
                    <Text variant={TextVariant.bodySm}>
                      ${calculateVolume(market.volume)} Vol
                    </Text>
                  </Box>
                </Box>
                <Box
                  display={Display.Flex}
                  flexDirection={FlexDirection.Row}
                  gap={2}
                  marginTop={2}
                  width={BlockSize.Full}
                >
                  <Button
                    style={{
                      width: '100%',
                      flex: 1,
                      backgroundColor: '#393939',
                      color: 'white',
                    }}
                    onClick={() => {
                      history.push(`/myriad/predict-bet/${market.outcomes[1].market_id}/${market.outcomes[1].id}`);
                    }}
                  >
                    Buy No ($10)
                  </Button>
                  <Button
                    style={{
                      width: '100%',
                      flex: 1,
                      backgroundColor: '#393939',
                      color: 'white',
                    }}
                    onClick={() => {
                      history.push(`/myriad/predict-bet/${market.outcomes[0].market_id}/${market.outcomes[0].id}`);
                    }}
                  >
                    Buy Yes ($10)
                  </Button>
                </Box>
              </Box>
            );
          })}
        {!loading && marketData && marketData.length === 0 && (
          <Text>No markets found.</Text>
        )}
      </Box>
    </>
  );
};

export default PredictMarketsContainer;
