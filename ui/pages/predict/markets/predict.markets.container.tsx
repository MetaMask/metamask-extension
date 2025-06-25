import React, { useState, useEffect } from 'react';
import { BigNumber } from 'bignumber.js';
import { useHistory } from 'react-router-dom';

import {
  Box,
  Button,
  ButtonVariant,
  ButtonLink,
  Text,
} from '../../../components/component-library';

import { Page } from '../../../components/multichain/pages/page';
import {
  Display,
  FlexDirection,
  BorderRadius,
  BackgroundColor,
  JustifyContent,
  TextVariant,
  FontWeight,
  TextColor,
  TextAlign,
  AlignItems,
  BlockSize,
  BorderColor,
} from '../../../helpers/constants/design-system';

const GAMMA_API_ENDPOINT = 'https://gamma-api.polymarket.com';

const PredictMarketsContainer = () => {
  const [marketData, setMarketData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const history = useHistory();

  const calculateVolume = (value: string | number | undefined) =>
    value
      ? new BigNumber(
          typeof value === 'string' ? value : value.toString(),
        ).toNumber().toFixed(2)
      : '0.00';

  const getMarkets = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${GAMMA_API_ENDPOINT}/markets?limit=5&closed=false&active=true&tag_id=51`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
      const marketsData = await response.json();
      setMarketData(marketsData);
    } catch (error) {
      console.error('Error fetching trades:', error);
      setMarketData([]);
    } finally {
      setLoading(false);
    }
  };

  const getDaysLeft = (endDateString: string) => {
    if (!endDateString) return '';
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
    <Box>
      {loading ? (
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          justifyContent={JustifyContent.center}
          alignItems={AlignItems.center}
          padding={8}
        >
          <Text variant={TextVariant.bodyMd} color={TextColor.textAlternative}>
            Loading positions...
          </Text>
        </Box>
      ) : marketData && marketData.length > 0 ? (
        marketData.map((market: any) => {
          return (
            <Box
              key={market.transactionHash}
              backgroundColor={BackgroundColor.backgroundDefault}
              borderRadius={BorderRadius.LG}
              padding={4}
              marginBottom={4}
              key={market.conditionId}
            >
              <Box
                display={Display.Flex}
                flexDirection={FlexDirection.Row}
                alignItems={AlignItems.center}
                gap={3}
              >
                <img
                  src={market.image}
                  alt={market.question}
                  style={{ width: 48, height: 48, borderRadius: 8 }}
                />
                <Box>
                  <Text variant={TextVariant.headingSm}>{market.question}</Text>
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
                    {getDaysLeft(market.endDate)}
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
                    history.push(`/predict-bet/${market.conditionId}`);
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
                    history.push(`/predict-bet/${market.conditionId}`);
                  }}
                >
                  Buy Yes ($10)
                </Button>
              </Box>
            </Box>
          );
        })
      ) : (
        <Text>No markets found.</Text>
      )}
    </Box>
  );
};

export default PredictMarketsContainer;
