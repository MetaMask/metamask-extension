import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

import {
  Box,
  Button,
  ButtonVariant,
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
  TextColor,
  TextAlign,
  AlignItems,
} from '../../../helpers/constants/design-system';
import PredictNavigation from '../predict.navigation';

import { getSelectedInternalAccount } from '../../../selectors';
import { usePolymarket } from '../usePolymarket';
import { Side } from '../types';

const CLOB_ENDPOINT = 'https://clob.polymarket.com';
const DATA_API_ENDPOINT = 'https://data-api.polymarket.com';

const PredictContainer = () => {
  const [marketData, setMarketData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const { placeOrder } = usePolymarket();

  const getTrades = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${DATA_API_ENDPOINT}/positions?limit=5&user=${selectedAccount.address}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
      const tradesData = await response.json();
      setMarketData(tradesData);
    } catch (error) {
      console.error('Error fetching trades:', error);
      setMarketData([]);
    } finally {
      setLoading(false);
    }
  };

  // Call getTrades on mount
  useEffect(() => {
    getTrades();
  }, []);

  const handleSell = async (trade: any) => {
    console.log(trade);
    const tickSize = await fetch(
      `${CLOB_ENDPOINT}/tick-size?token_id=${trade.asset}`,
    );
    const tickSizeData = await tickSize.json();
    console.log(tickSizeData);
    if (!tickSizeData) {
      console.error('No tick size found');
      return;
    }
    placeOrder({
      tokenId: trade.asset,
      price: trade.curPrice,
      size: trade.size,
      tickSize: tickSizeData.minimum_tick_size,
      side: Side.SELL,
    });
  };

  return (
    <Page className="main-container" data-testid="remote-mode">
      <Box backgroundColor={BackgroundColor.backgroundAlternative} padding={4}>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          justifyContent={JustifyContent.center}
          textAlign={TextAlign.Center}
        >
          <Text variant={TextVariant.headingMd}>Profit and Loss</Text>
          <Text variant={TextVariant.bodySm}>
            Track your profit and loss for your predictions.
          </Text>
        </Box>
        <PredictNavigation />
        <Box>
          <Text>Coming soon ™️</Text>
        </Box>
      </Box>
    </Page>
  );
};

export default PredictContainer;
